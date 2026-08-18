import { describe, expect, it } from 'vitest';
import type { Node, Config } from '@markdoc/markdoc';
import { schema } from './schema';

// The context-dependent validators (tableExists, columnsExistInTable, etc.) no-op
// when handed a non-validation context, which isolates the default_top_n validators.
const config = {} as Config;
const context = {
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined
};

const validate = (attributes: Record<string, unknown>) => {
	const node = { attributes } as unknown as Node;
	return schema.validate(node, config, context).filter((e) => e.id?.startsWith('default-top-n'));
};

describe('dropdown default_top_n validation', () => {
	it('accepts a positive integer on a multi-select dropdown', () => {
		expect(validate({ default_top_n: 3, multiple: true })).toEqual([]);
	});

	it('warns when used without multiple=true', () => {
		const diagnostics = validate({ default_top_n: 3 });
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].id).toBe('default-top-n-requires-multiple');
		expect(diagnostics[0].level).toBe('warning');
	});

	it('warns when multiple is explicitly false', () => {
		const diagnostics = validate({ default_top_n: 3, multiple: false });
		expect(diagnostics.map((d) => d.id)).toContain('default-top-n-requires-multiple');
	});

	it('errors on a non-positive value', () => {
		const diagnostics = validate({ default_top_n: 0, multiple: true });
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].id).toBe('default-top-n-invalid');
		expect(diagnostics[0].level).toBe('error');
	});

	it('reports only the invalid error (no requires-multiple warning) for an invalid value on a single-select', () => {
		const diagnostics = validate({ default_top_n: 0 });
		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0].id).toBe('default-top-n-invalid');
	});

	it('errors on a non-integer value', () => {
		expect(validate({ default_top_n: 2.5, multiple: true }).map((d) => d.id)).toContain(
			'default-top-n-invalid'
		);
	});

	it('produces no diagnostics when the attribute is absent', () => {
		expect(validate({ multiple: true })).toEqual([]);
	});
});
