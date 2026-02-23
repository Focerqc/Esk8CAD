export const ID_REGEX = /^part-(\d{4})\.json$/;

/**
 * Calculates the next sequential ID based on a list of filenames.
 * 
 * @param files List of filenames (e.g., ['part-0001.json', 'part-0002.json'])
 * @returns The next ID as a padded string (e.g., '0003')
 */
export const getNextId = (files: string[]): string => {
    const ids = files
        .map(file => {
            const match = file.match(ID_REGEX);
            return match ? parseInt(match[1], 10) : -1;
        })
        .filter(id => id !== -1);

    // If no existing IDs, start at 1
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;

    // Increment and pad
    return (maxId + 1).toString().padStart(4, '0');
};

/**
 * Validates the submission categories.
 * 
 * Rules:
 * - Must have at least 1 category.
 * - Must have at most 2 categories.
 * - If 2 categories, one MUST be "OEM".
 */
export const validateCategories = (categories: string[]): { valid: boolean; error?: string } => {
    if (!categories || categories.length === 0) {
        return { valid: false, error: "At least one category is required." };
    }

    if (categories.length > 2) {
        return { valid: false, error: "Maximum of 2 categories allowed." };
    }

    if (categories.length === 2) {
        // Check if "OEM" is present (case-insensitive for robustness, but spec says 'OEM')
        const hasOem = categories.some(c => c.toUpperCase() === 'OEM');
        if (!hasOem) {
            return { valid: false, error: "Secondary category must be 'OEM'." };
        }
    }

    return { valid: true };
};
