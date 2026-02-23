import { describe, it, expect } from 'vitest';
import { getNextId, validateCategories } from './_utils';

describe('Submission Utils', () => {
    describe('getNextId', () => {
        it('should return "0001" for empty file list', () => {
            const files: string[] = [];
            expect(getNextId(files)).toBe('0001');
        });

        it('should increment correctly from single file', () => {
            const files = ['part-0001.json'];
            expect(getNextId(files)).toBe('0002');
        });

        it('should increment correctly from multiple files', () => {
            const files = ['part-0001.json', 'part-0003.json', 'part-0002.json'];
            expect(getNextId(files)).toBe('0004');
        });

        it('should handle gaps in sequence', () => {
            const files = ['part-0010.json', 'part-0001.json'];
            expect(getNextId(files)).toBe('0011');
        });

        it('should ignore non-matching files', () => {
            const files = ['part-0001.json', 'README.md', 'part-invalid.json'];
            expect(getNextId(files)).toBe('0002');
        });
    });

    describe('validateCategories', () => {
        it('should validate single category', () => {
            const result = validateCategories(['Motor']);
            expect(result.valid).toBe(true);
        });

        it('should validate category + OEM', () => {
            const result = validateCategories(['Motor', 'OEM']);
            expect(result.valid).toBe(true);
        });

        it('should validate category + oem (case insensitive)', () => {
            const result = validateCategories(['Motor', 'oem']);
            expect(result.valid).toBe(true);
        });

        it('should fail on empty categories', () => {
            const result = validateCategories([]);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('required');
        });

        it('should fail on > 2 categories', () => {
            const result = validateCategories(['Motor', 'OEM', 'Wheel']);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Maximum');
        });

        it('should fail on 2 categories without OEM', () => {
            const result = validateCategories(['Motor', 'Wheel']);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('OEM');
        });
    });
});
