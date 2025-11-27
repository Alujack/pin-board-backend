import { describe, it, expect } from '@jest/globals';

describe('Basic Test Suite', () => {
    it('should pass a simple test', () => {
        expect(1 + 1).toBe(2);
    });

    it('should handle async operations', async () => {
        const result = await Promise.resolve('success');
        expect(result).toBe('success');
    });

    it('should handle objects', () => {
        const obj = { name: 'test', value: 123 };
        expect(obj).toHaveProperty('name');
        expect(obj.name).toBe('test');
    });
});

