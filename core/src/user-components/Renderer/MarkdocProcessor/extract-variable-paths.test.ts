import { describe, it, expect } from 'vitest';
import { extractVariablePaths } from './process-markdoc';

describe('extractVariablePaths', () => {
	describe('basic variable extraction', () => {
		it('should extract simple variable', () => {
			expect(extractVariablePaths('{{ $title }}')).toEqual(['title']);
		});

		it('should extract variable without spaces', () => {
			expect(extractVariablePaths('{{$title}}')).toEqual(['title']);
		});

		it('should extract multiple variables', () => {
			expect(extractVariablePaths('{{ $name }} and {{ $age }}')).toEqual(['name', 'age']);
		});

		it('should return empty array for no variables', () => {
			expect(extractVariablePaths('Hello world')).toEqual([]);
		});

		it('should return empty array for empty string', () => {
			expect(extractVariablePaths('')).toEqual([]);
		});
	});

	describe('nested path extraction', () => {
		it('should extract single nested path', () => {
			expect(extractVariablePaths('{{ $translations.greeting }}')).toEqual([
				'translations.greeting'
			]);
		});

		it('should extract deeply nested path', () => {
			expect(extractVariablePaths('{{ $config.theme.colors.primary }}')).toEqual([
				'config.theme.colors.primary'
			]);
		});

		it('should extract array index syntax', () => {
			expect(extractVariablePaths('{{ $items[0] }}')).toEqual(['items[0]']);
		});

		it('should extract mixed dot and array syntax', () => {
			expect(extractVariablePaths('{{ $data.items[0].name }}')).toEqual(['data.items[0].name']);
		});

		it('should extract multiple array indices', () => {
			expect(extractVariablePaths('{{ $matrix[0][1] }}')).toEqual(['matrix[0][1]']);
		});
	});

	describe('empty segments (fork parity)', () => {
		// The dot-segment quantifier is `*` to stay byte-for-byte with
		// @hughess/markdoc's interpolateString, so empty segments now match and are
		// surfaced as (broken) variable references rather than silently ignored —
		// this keeps editor validation consistent with the fork's runtime.
		it('matches empty segments like $translations..key', () => {
			expect(extractVariablePaths('{{ $translations..key }}')).toEqual(['translations..key']);
		});

		it('still does NOT match a leading dot like $.key (name needs a first char)', () => {
			expect(extractVariablePaths('{{ $.key }}')).toEqual([]);
		});

		it('matches a trailing dot', () => {
			expect(extractVariablePaths('{{ $config. }}')).toEqual(['config.']);
		});

		it('matches multiple consecutive dots', () => {
			expect(extractVariablePaths('{{ $a...b }}')).toEqual(['a...b']);
		});
	});

	describe('variable names with special characters', () => {
		it('should extract variables with hyphens', () => {
			expect(extractVariablePaths('{{ $my-variable }}')).toEqual(['my-variable']);
		});

		it('should extract variables with underscores', () => {
			expect(extractVariablePaths('{{ $my_variable }}')).toEqual(['my_variable']);
		});

		it('should extract variables with numbers', () => {
			expect(extractVariablePaths('{{ $var123 }}')).toEqual(['var123']);
		});

		it('should extract nested paths with hyphens and underscores', () => {
			expect(extractVariablePaths('{{ $my-config.theme_color }}')).toEqual([
				'my-config.theme_color'
			]);
		});
	});

	describe('non-frontmatter variables', () => {
		it('should NOT extract filter variables (no $ prefix)', () => {
			expect(extractVariablePaths('{{ filter.value }}')).toEqual([]);
		});

		it('should NOT extract expressions', () => {
			expect(extractVariablePaths('{{ 1 + 2 }}')).toEqual([]);
		});

		it('should only extract $ prefixed variables', () => {
			expect(extractVariablePaths('{{ filter.value }} and {{ $title }}')).toEqual(['title']);
		});
	});

	describe('edge cases', () => {
		it('should handle variable at start of string', () => {
			expect(extractVariablePaths('{{ $title }} is the title')).toEqual(['title']);
		});

		it('should handle variable at end of string', () => {
			expect(extractVariablePaths('The title is {{ $title }}')).toEqual(['title']);
		});

		it('should handle variables with extra whitespace', () => {
			expect(extractVariablePaths('{{   $title   }}')).toEqual(['title']);
		});

		it('should handle multiple variables on same line', () => {
			expect(extractVariablePaths('{{ $a }}{{ $b }}{{ $c }}')).toEqual(['a', 'b', 'c']);
		});

		it('should handle newlines between variables', () => {
			expect(extractVariablePaths('{{ $a }}\n{{ $b }}')).toEqual(['a', 'b']);
		});
	});

	describe('fallback syntax (DECISION 1 — still extracted so it still validates)', () => {
		it('extracts the path even when a quoted fallback is present', () => {
			expect(extractVariablePaths("{{ $title | 'Untitled' }}")).toEqual(['title']);
		});

		it('extracts the path with an unquoted fallback', () => {
			expect(extractVariablePaths('{{ $metric_label | Attendance }}')).toEqual(['metric_label']);
		});

		it('extracts a nested path with a fallback', () => {
			expect(extractVariablePaths("{{ $a.b.c | 'x' }}")).toEqual(['a.b.c']);
		});

		it('extracts the path with an empty fallback', () => {
			expect(extractVariablePaths('{{ $title | }}')).toEqual(['title']);
		});

		it('does not treat a filter-variable fallback as a frontmatter ref', () => {
			expect(extractVariablePaths("{{ dropdown.selected | 'x' }}")).toEqual([]);
		});
	});
});
