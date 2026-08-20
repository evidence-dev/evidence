import { describe, expect, it } from 'vitest';
import { recursivelyReplaceVariables } from './zod-attribute';

// Helper function to create a Variable object that markdoc would create
function createVariable(path: string[]) {
	return {
		$$mdtype: 'Variable',
		path
	};
}

describe('ZodAttribute recursivelyReplaceVariables', () => {
	it('should resolve simple variables', () => {
		const variables = { name: 'John', age: 30 };
		const value = createVariable(['name']);
		const result = recursivelyReplaceVariables(value, variables);

		expect(result).toBe('John');
	});

	it('should resolve nested variables', () => {
		const variables = {
			company: {
				name: 'Acme Corp',
				address: {
					city: 'New York'
				}
			}
		};
		const value = createVariable(['company', 'name']);

		const result = recursivelyReplaceVariables(value, variables);

		expect(result).toBe('Acme Corp');
	});

	it('should handle deeply nested variables', () => {
		const variables = {
			user: {
				profile: {
					contact: {
						email: 'test@example.com'
					}
				}
			}
		};
		const value = createVariable(['user', 'profile', 'contact', 'email']);

		const result = recursivelyReplaceVariables(value, variables);

		expect(result).toBe('test@example.com');
	});

	it('should handle variables with different data types', () => {
		const variables = {
			config: {
				enabled: true,
				count: 42,
				message: 'Hello World',
				items: [1, 2, 3]
			}
		};

		// Test boolean
		const boolValue = createVariable(['config', 'enabled']);
		const boolResult = recursivelyReplaceVariables(boolValue, variables);
		expect(boolResult).toBe(true);

		// Test number
		const numValue = createVariable(['config', 'count']);
		const numResult = recursivelyReplaceVariables(numValue, variables);
		expect(numResult).toBe(42);

		// Test array
		const arrValue = createVariable(['config', 'items']);
		const arrResult = recursivelyReplaceVariables(arrValue, variables);
		expect(arrResult).toEqual([1, 2, 3]);
	});

	it('should return original value when variable is not found', () => {
		const variables = { name: 'John' };
		const value = createVariable(['nonexistent']);

		const result = recursivelyReplaceVariables(value, variables);

		expect(result).toEqual(value);
	});

	it('should handle non-object intermediate values gracefully', () => {
		const variables = {
			config: {
				enabled: true,
				message: 'Hello World'
			}
		};

		// This should fail with the current implementation because it tries to access
		// properties on a boolean value
		const value = createVariable(['config', 'enabled', 'someProperty']);

		const result = recursivelyReplaceVariables(value, variables);

		// Should return the original variable object since the path is invalid
		expect(result).toEqual(value);
	});

	it('should handle null intermediate values gracefully', () => {
		const variables = {
			config: {
				enabled: null,
				message: 'Hello World'
			}
		};

		// This should fail with the current implementation because it tries to access
		// properties on a null value
		const value = createVariable(['config', 'enabled', 'someProperty']);

		const result = recursivelyReplaceVariables(value, variables);

		// Should return the original variable object since the path is invalid
		expect(result).toEqual(value);
	});
});
