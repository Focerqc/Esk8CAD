import { Part } from './parts';

export interface AttributeTemplate {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'dimension' | 'weight' | 'bearing_size' | 'enum' | 'array';
    options?: string[];
    unit?: string;
    description?: string;
}

// Re-export Part for convenience
export type { Part };

// 1. Unit conversion wrapper
// Implements standard conversion logic for metric basing
export function getNormalizedMetric(value: number, unit: string | null | undefined, type: 'dimension' | 'weight' | string): number {
    if (value === null || value === undefined || isNaN(value)) return NaN;
    if (!unit) return value; // No unit provided, assume it's already base

    const lowerUnit = unit.toLowerCase();

    if (type === 'dimension') {
        if (lowerUnit === 'in' || lowerUnit === '"' || lowerUnit === 'inch') return value * 25.4;
        if (lowerUnit === 'cm') return value * 10;
        if (lowerUnit === 'm') return value * 1000;
        return value; // mm is base
    }

    if (type === 'weight') {
        if (lowerUnit === 'lb' || lowerUnit === 'lbs') return value * 0.453592;
        if (lowerUnit === 'oz') return value * 0.0283495;
        if (lowerUnit === 'g') return value / 1000;
        return value; // kg is base
    }

    // Unhandled types just return value
    return value;
}

export function normalizeValue(part: Part, key: string): { value: any, unit: string, normalizedValue?: number } {
    // Check root level properties first
    if (key === 'Brand' || key === 'brand') {
        return { value: part.brands?.name, unit: '' };
    }
    if (key === 'Category' || key === 'category') {
        return { value: part.part_categories?.name, unit: '' };
    }
    if (key === 'Model' || key === 'model') {
        return { value: part.models?.name, unit: '' };
    }

    const attributes = part?.attributes as Record<string, any>;
    if (!attributes) return { value: undefined, unit: '' };

    const value = attributes[key];
    const unit = attributes[`${key}__unit`] || '';

    let normalizedValue = undefined;
    if (value !== undefined && value !== null && (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== ''))) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            // We infer the type based on unit for simplicity.
            const isDimension = ['mm', 'cm', 'in', 'inch', '"', 'm'].includes(unit.toLowerCase());
            const isWeight = ['kg', 'g', 'lb', 'lbs', 'oz'].includes(unit.toLowerCase());
            const inferredType = isDimension ? 'dimension' : isWeight ? 'weight' : 'unknown';
            
            normalizedValue = getNormalizedMetric(numValue, unit, inferredType);
        }
    }

    return { value, unit, normalizedValue };
}

// 3. Complex Parsing
export function parseBearingSize(sizeString: string | undefined): { id: number, od: number, width: number } | null {
    if (!sizeString || typeof sizeString !== 'string') return null;
    
    // Split by 'x' or 'X' and parse numbers
    const parts = sizeString.toLowerCase().split('x').map(s => parseFloat(s.trim()));
    
    if (parts.length >= 3 && parts.slice(0, 3).every(p => !isNaN(p))) {
        return { 
            id: parts[0], 
            od: parts[1], 
            width: parts[2] 
        };
    }
    
    return null;
}

// 4. Filter Engine
export function matchesFilters(part: Part, activeFilters: Record<string, any>, category?: any): boolean {
    if (!activeFilters || Object.keys(activeFilters).length === 0) return true;

    for (const [key, filterValue] of Object.entries(activeFilters)) {
        // If filter is explicitly empty array or null, we skip (it's "inactive")
        if (filterValue === undefined || filterValue === null) continue;
        if (Array.isArray(filterValue) && filterValue.length === 0) continue;

        const { value: rawValue, normalizedValue } = normalizeValue(part, key);
        if (rawValue === undefined || rawValue === null) return false;
        
        // --- Special Logic: Bearing Size ---
        // Match exact key "Bearing Size" as requested, or dynamically detect it if needed
        if (key === 'Bearing Size' || key.toLowerCase() === 'bearing size' || (typeof filterValue === 'object' && filterValue !== null && filterValue._type === 'bearing_size')) {
            const bearingRaw = parseBearingSize(String(rawValue));
            if (!bearingRaw) return false;
            
            // Assume filterValue might separate min/max for each dimension: {id: {min, max}, od: {min, max}, width: {min, max}}
            // OR standard { min: {id, od, width}, max: {id, od, width} }
            const idMin = filterValue?.min?.id ?? filterValue?.id?.min;
            const idMax = filterValue?.max?.id ?? filterValue?.id?.max;
            
            const odMin = filterValue?.min?.od ?? filterValue?.od?.min;
            const odMax = filterValue?.max?.od ?? filterValue?.od?.max;
            
            const widthMin = filterValue?.min?.width ?? filterValue?.width?.min;
            const widthMax = filterValue?.max?.width ?? filterValue?.width?.max;

            if (idMin !== undefined && bearingRaw.id < idMin) return false;
            if (idMax !== undefined && bearingRaw.id > idMax) return false;
            
            if (odMin !== undefined && bearingRaw.od < odMin) return false;
            if (odMax !== undefined && bearingRaw.od > odMax) return false;
            
            if (widthMin !== undefined && bearingRaw.width < widthMin) return false;
            if (widthMax !== undefined && bearingRaw.width > widthMax) return false;
            
            continue;
        }
        
        // --- Handle Arrays (for checkbox/multi-select) ---
        if (Array.isArray(filterValue)) {
            // If the part's value is also an array, check for intersection
            if (Array.isArray(rawValue)) {
                if (!filterValue.some(fv => rawValue.includes(fv))) {
                    return false;
                }
            } else {
                // If the part's value is a scalar, check if it's in the allowed array
                if (!filterValue.includes(rawValue)) {
                    return false;
                }
            }
            continue;
        } 
        
        // --- Handle Objects with {min, max} (for dimensions/weights) ---
        if (typeof filterValue === 'object' && filterValue !== null && ('min' in filterValue || 'max' in filterValue)) {
            const valToCompare = normalizedValue !== undefined ? normalizedValue : Number(rawValue);
            
            if (isNaN(valToCompare)) return false;
            
            if (filterValue.min !== undefined && filterValue.min !== null && valToCompare < filterValue.min) return false;
            if (filterValue.max !== undefined && filterValue.max !== null && valToCompare > filterValue.max) return false;
            
            continue;
        }
        
        // --- Direct equality (Fallback) ---
        if (rawValue !== filterValue) {
            return false;
        }
    }

    return true;
}
