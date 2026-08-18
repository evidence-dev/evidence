import { describe, it, expect } from 'vitest';
import {
	containsVariableSyntax,
	stripTypeCast,
	stripIdentifierQuotes,
	getTableFromContext,
	type ValidationContext
} from './types';

/**
 * Tests for validator utility functions.
 *
 * These utilities help validators handle variable syntax and other edge cases:
 *
 * - containsVariableSyntax(): Detects {{ ... }} patterns in values
 * - stripTypeCast(): Removes PostgreSQL type casts from column names
 * - getTableFromContext(): Retrieves table metadata from validation context
 */

describe('containsVariableSyntax', () => {
	describe('detects variable syntax', () => {
		it('detects simple variable', () => {
			expect(containsVariableSyntax('{{filter}}')).toBe(true);
		});

		it('detects variable with property', () => {
			expect(containsVariableSyntax('{{filter.selected}}')).toBe(true);
		});

		it('detects variable in the middle of text', () => {
			expect(containsVariableSyntax('prefix {{filter}} suffix')).toBe(true);
		});

		it('detects variable at start of text', () => {
			expect(containsVariableSyntax('{{filter}} suffix')).toBe(true);
		});

		it('detects variable at end of text', () => {
			expect(containsVariableSyntax('prefix {{filter}}')).toBe(true);
		});

		it('detects variable with spaces inside braces', () => {
			expect(containsVariableSyntax('{{ filter }}')).toBe(true);
		});

		it('detects variable with dots and pipes', () => {
			expect(containsVariableSyntax("{{filter.property | 'default'}}")).toBe(true);
		});

		it('detects multiple variables', () => {
			expect(containsVariableSyntax('{{a}} and {{b}}')).toBe(true);
		});

		it('detects frontmatter variable syntax', () => {
			expect(containsVariableSyntax('{{$var}}')).toBe(true);
		});
	});

	describe('returns false for non-variable content', () => {
		it('returns false for plain text', () => {
			expect(containsVariableSyntax('plain text')).toBe(false);
		});

		it('returns false for empty string', () => {
			expect(containsVariableSyntax('')).toBe(false);
		});

		it('returns false for single braces', () => {
			expect(containsVariableSyntax('{filter}')).toBe(false);
		});

		it('returns false for unclosed variable', () => {
			expect(containsVariableSyntax('{{filter')).toBe(false);
		});

		it('returns false for unopened variable', () => {
			expect(containsVariableSyntax('filter}}')).toBe(false);
		});

		it('returns false for empty braces', () => {
			expect(containsVariableSyntax('{{}}')).toBe(false);
		});

		it('returns false for SQL with curly braces in strings', () => {
			// This is valid SQL, not a variable
			expect(containsVariableSyntax("category = '{test}' AND status = 'active'")).toBe(false);
		});
	});

	describe('handles non-string inputs', () => {
		it('returns false for numbers', () => {
			expect(containsVariableSyntax(42)).toBe(false);
		});

		it('returns false for booleans', () => {
			expect(containsVariableSyntax(true)).toBe(false);
			expect(containsVariableSyntax(false)).toBe(false);
		});

		it('returns false for null', () => {
			expect(containsVariableSyntax(null)).toBe(false);
		});

		it('returns false for undefined', () => {
			expect(containsVariableSyntax(undefined)).toBe(false);
		});

		it('returns false for objects', () => {
			expect(containsVariableSyntax({ value: '{{filter}}' })).toBe(false);
		});

		it('returns false for arrays', () => {
			expect(containsVariableSyntax(['{{filter}}'])).toBe(false);
		});
	});

	describe('real-world validator use cases', () => {
		it('allows validators to skip table name with variable', () => {
			const tableName = '{{data_source}}';

			// Validator pattern: skip if contains variable
			if (containsVariableSyntax(tableName)) {
				// Skip validation - will be resolved at runtime
				expect(true).toBe(true);
			} else {
				// Would normally validate table exists
				expect(false).toBe(true);
			}
		});

		it('validates table name without variable', () => {
			const tableName = 'orders';

			if (containsVariableSyntax(tableName)) {
				expect(false).toBe(true);
			} else {
				// Normal validation path
				expect(true).toBe(true);
			}
		});

		it('handles SQL expressions with embedded variables', () => {
			const whereClause = "category = {{category_filter}} AND status = 'active'";
			expect(containsVariableSyntax(whereClause)).toBe(true);
		});

		it('handles column expressions with variables', () => {
			const columnExpr = 'sum({{metric_column}})';
			expect(containsVariableSyntax(columnExpr)).toBe(true);
		});
	});
});

describe('stripTypeCast', () => {
	describe('removes PostgreSQL type casts', () => {
		it('strips simple type cast', () => {
			expect(stripTypeCast('column::text')).toBe('column');
		});

		it('strips type cast with precision', () => {
			expect(stripTypeCast('column::numeric(10,2)')).toBe('column');
		});

		it('strips schema-qualified type cast', () => {
			expect(stripTypeCast('column::pg_catalog.varchar')).toBe('column');
		});

		it('strips type cast with array notation', () => {
			expect(stripTypeCast('column::text[]')).toBe('column');
		});

		it('strips multiple type casts', () => {
			expect(stripTypeCast('column::text::varchar')).toBe('column');
		});
	});

	describe('handles edge cases', () => {
		it('returns column unchanged when no type cast', () => {
			expect(stripTypeCast('regular_column')).toBe('regular_column');
		});

		it('handles empty string', () => {
			expect(stripTypeCast('')).toBe('');
		});

		it('handles null gracefully', () => {
			expect(stripTypeCast(null as unknown as string)).toBe(null);
		});

		it('handles undefined gracefully', () => {
			expect(stripTypeCast(undefined as unknown as string)).toBe(undefined);
		});
	});
});

describe('stripIdentifierQuotes', () => {
	it('strips double-quoted identifiers and unescapes inner quotes', () => {
		expect(stripIdentifierQuotes('"Total Sales"')).toBe('Total Sales');
		expect(stripIdentifierQuotes('"order"')).toBe('order');
		expect(stripIdentifierQuotes('"a""b"')).toBe('a"b');
	});

	it('strips backtick-quoted identifiers', () => {
		expect(stripIdentifierQuotes('`Total Sales`')).toBe('Total Sales');
		expect(stripIdentifierQuotes('`a``b`')).toBe('a`b');
	});

	it('leaves bare identifiers untouched', () => {
		expect(stripIdentifierQuotes('CATEGORY')).toBe('CATEGORY');
		expect(stripIdentifierQuotes('order_date')).toBe('order_date');
	});

	it('does not strip an unbalanced or interior quote', () => {
		expect(stripIdentifierQuotes('"Total Sales')).toBe('"Total Sales');
		expect(stripIdentifierQuotes('a"b')).toBe('a"b');
	});

	it('handles empty / nullish input gracefully', () => {
		expect(stripIdentifierQuotes('')).toBe('');
		expect(stripIdentifierQuotes(null as unknown as string)).toBe(null);
		expect(stripIdentifierQuotes(undefined as unknown as string)).toBe(undefined);
	});
});

describe('getTableFromContext: inline query metadata', () => {
	const makeContext = (table: { error?: string } | undefined): ValidationContext =>
		({
			metadata: undefined,
			filters: undefined,
			inlineQueries: undefined,
			inlineQueryMetadata: {
				initialized: true,
				getTable: () => table
			}
		}) as unknown as ValidationContext;

	it('returns an inline query table that loaded successfully', () => {
		const table = { error: undefined };
		expect(getTableFromContext('q', makeContext(table))).toBe(table);
	});

	it('skips an inline query table whose DESCRIBE failed (has error)', () => {
		// A chained inline query whose catalog metadata could not be resolved is
		// stored with an error and zero columns. It must NOT be returned as found,
		// or column validators flag every column and the editor hides the component.
		const table = { error: 'Catalog query failed', getColumn: () => undefined };
		expect(getTableFromContext('q', makeContext(table))).toBeUndefined();
	});

	it('returns undefined when the inline query is absent', () => {
		expect(getTableFromContext('q', makeContext(undefined))).toBeUndefined();
	});
});
