import React, { useState } from 'react';
import { Form, Accordion, Badge, Stack } from 'react-bootstrap';
import { AttributeTemplate } from '../util/filterUtils';

interface FilterSidebarProps {
    templates: AttributeTemplate[];
    activeFilters: Record<string, any>;
    setActiveFilters: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ templates, activeFilters, setActiveFilters }) => {
    
    // Sort templates: primary or common ones first, then alphabetically
    const sortedTemplates = [...templates].sort((a, b) => {
        const priorityKeys = ['Brand', 'Model', 'Category'];
        const aIdx = priorityKeys.indexOf(a.key);
        const bIdx = priorityKeys.indexOf(b.key);
        
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        
        return a.key.localeCompare(b.key);
    });

    const getSummary = (template: AttributeTemplate) => {
        const { key, type, unit } = template;
        const value = activeFilters[key];
        if (!value) return null;

        if (Array.isArray(value)) {
            if (value.length === 0) return null;
            if (value.length === 1) return value[0];
            return `${value.length} Selected`;
        }

        if (typeof value === 'object') {
            if (type === 'bearing_size') return "Filtered";
            const { min, max } = value;
            if (min !== undefined && max !== undefined) return `${min}-${max}${unit || ''}`;
            if (min !== undefined) return `> ${min}${unit || ''}`;
            if (max !== undefined) return `< ${max}${unit || ''}`;
        }
        return null;
    };

    const handleCheckboxChange = (key: string, value: string, checked: boolean) => {
        setActiveFilters(prev => {
            const currentArray = Array.isArray(prev[key]) ? prev[key] : [];
            const newArray = checked 
                ? [...currentArray, value]
                : currentArray.filter((v: string) => v !== value);
            
            if (newArray.length === 0) {
                const newFilters = { ...prev };
                delete newFilters[key];
                return newFilters;
            }
            return { ...prev, [key]: newArray };
        });
    };

    const handleMinMaxChange = (key: string, bound: 'min' | 'max', value: string, dimension?: 'id' | 'od' | 'width') => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            const numValue = value === '' ? undefined : parseFloat(value);
            
            if (dimension) {
                // Bearing logic e.g. { _type: 'bearing_size', min: { id: ... }, max: { width: ... } }
                const currentObj = newFilters[key] || { _type: 'bearing_size', min: {}, max: {} };
                if (!currentObj[bound]) currentObj[bound] = {};
                
                if (numValue === undefined || isNaN(numValue)) {
                    delete currentObj[bound][dimension];
                } else {
                    currentObj[bound][dimension] = numValue;
                }
                
                // Cleanup empty objects
                if (Object.keys(currentObj.min).length === 0 && Object.keys(currentObj.max).length === 0) {
                    delete newFilters[key];
                } else {
                    newFilters[key] = currentObj;
                }
            } else {
                // Standard Min/Max logic
                const currentObj = newFilters[key] || {};
                if (numValue === undefined || isNaN(numValue)) {
                    delete currentObj[bound];
                } else {
                    currentObj[bound] = numValue;
                }
                
                if (Object.keys(currentObj).length === 0) {
                    delete newFilters[key];
                } else {
                    newFilters[key] = currentObj;
                }
            }
            return newFilters;
        });
    };

    const renderFilterInput = (template: AttributeTemplate) => {
        const { key, type, options, unit } = template;
        const currentFilter = activeFilters[key];

        if (type === 'enum' || type === 'string' || type === 'array') {
            const opts = options || [];
            if (opts.length === 0) return <div className="small text-muted fst-italic">No options defined</div>;
            
            return (
                <div className="d-flex flex-column gap-2 mt-2">
                    {opts.map(opt => (
                        <Form.Check 
                            key={opt}
                            type="checkbox"
                            label={opt}
                            checked={Array.isArray(currentFilter) && currentFilter.includes(opt)}
                            onChange={(e) => handleCheckboxChange(key, opt, e.target.checked)}
                            className="text-light opacity-75"
                        />
                    ))}
                </div>
            );
        }

        if (type === 'dimension' || type === 'weight' || type === 'number') {
            return (
                <div className="d-flex align-items-center gap-2 mt-2">
                    <Form.Control 
                        type="number" 
                        placeholder="Min" 
                        size="sm"
                        className="bg-black text-light border-secondary"
                        value={currentFilter?.min !== undefined ? currentFilter.min : ''}
                        onChange={(e) => handleMinMaxChange(key, 'min', e.target.value)}
                    />
                    <span className="text-muted">-</span>
                    <Form.Control 
                        type="number" 
                        placeholder="Max" 
                        size="sm"
                        className="bg-black text-light border-secondary"
                        value={currentFilter?.max !== undefined ? currentFilter.max : ''}
                        onChange={(e) => handleMinMaxChange(key, 'max', e.target.value)}
                    />
                    {unit && <span className="small text-info opacity-75">{unit}</span>}
                </div>
            );
        }

        if (type === 'bearing_size') {
            return (
                <div className="d-flex flex-column gap-2 mt-2">
                    {['id', 'od', 'width'].map((dim) => (
                        <div key={dim} className="d-flex align-items-center gap-2">
                            <span className="small text-muted uppercase" style={{ width: '40px' }}>{dim}</span>
                            <Form.Control 
                                type="number" 
                                placeholder="Min" 
                                size="sm"
                                className="bg-black text-light border-secondary"
                                value={currentFilter?.min?.[dim] !== undefined ? currentFilter.min[dim] : ''}
                                onChange={(e) => handleMinMaxChange(key, 'min', e.target.value, dim as any)}
                            />
                            <Form.Control 
                                type="number" 
                                placeholder="Max" 
                                size="sm"
                                className="bg-black text-light border-secondary"
                                value={currentFilter?.max?.[dim] !== undefined ? currentFilter.max[dim] : ''}
                                onChange={(e) => handleMinMaxChange(key, 'max', e.target.value, dim as any)}
                            />
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="small text-muted fst-italic">Unsupported filter</div>;
    };

    const hasActiveFilters = Object.keys(activeFilters).length > 0;

    return (
        <div className="filter-sidebar">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0 fw-bold uppercase letter-spacing-1 text-info">Filters</h5>
                {hasActiveFilters && (
                    <Badge 
                        bg="secondary" 
                        className="cursor-pointer hover-opacity-100" 
                        onClick={() => setActiveFilters({})}
                        style={{ cursor: 'pointer' }}>
                        Clear All
                    </Badge>
                )}
            </div>
            
            {templates.length === 0 ? (
                <div className="text-muted small">Loading filters...</div>
            ) : (
                <Accordion alwaysOpen data-bs-theme="dark" className="bg-transparent border-0">
                    {sortedTemplates.map((template, i) => {
                        const hasFilter = activeFilters[template.key] !== undefined;
                        return (
                            <Accordion.Item eventKey={String(i)} key={template.key} className="bg-transparent border-bottom border-zinc-800">
                                <Accordion.Header>
                                    <div className="d-flex align-items-center justify-content-between w-100 pe-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-semibold uppercase small">{template.key}</span>
                                            {hasFilter && <Badge bg="info" pill style={{ width: 6, height: 6, padding: 0 }}></Badge>}
                                        </div>
                                        {hasFilter && (
                                            <span className="text-info extreme-small fw-bold opacity-75 text-truncate ms-1" style={{ maxWidth: '110px' }}>
                                                {getSummary(template)}
                                            </span>
                                        )}
                                    </div>
                                </Accordion.Header>
                                <Accordion.Body className="pt-0 pb-3">
                                    {renderFilterInput(template)}
                                </Accordion.Body>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                .filter-sidebar .accordion-button {
                    background-color: transparent !important;
                    color: #fff !important;
                    padding: 1rem 0;
                    box-shadow: none !important;
                }
                .filter-sidebar .accordion-button::after {
                    filter: invert(1);
                    transform: scale(0.8);
                }
                .filter-sidebar .accordion-item {
                    border: none;
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                }
            `}} />
        </div>
    );
};

export default FilterSidebar;
