// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import Markdoc from '@markdoc/markdoc';
import { Filters } from '../../../Filters.svelte';
import { registerFiltersFromAST } from '../../Renderer/MarkdocProcessor/register-filters';
import { schema } from './schema';

function scopeErrors(markdown: string) {
	const ast = Markdoc.parse(markdown);
	const filters = new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: { computedDefaultDateRangeEnd: '2026-08-14' } as never,
		dialect: undefined
	});
	registerFiltersFromAST(ast, filters);
	const tag = [...ast.walk()].find((node) => node.tag === 'commentary')!;
	const context = { metadata: undefined, filters, inlineQueries: undefined, trees: undefined };
	return schema
		.validate(tag, {} as never, context)
		.filter((error) => error.id === 'invalid-commentary-scope')
		.map((error) => error.message);
}

const workflowPage = (body: string) =>
	`---\nworkflow:\n  period:\n    grain: quarter\n---\n\n{% dropdown id="fund" data="funds" value_column="fund" /%}\n\n${body}\n`;

describe('commentary scope validation', () => {
	it('accepts period and a single-select input together', () => {
		expect(scopeErrors(workflowPage('{% commentary id="c" scope=["period", "fund"] /%}'))).toEqual(
			[]
		);
	});

	it('accepts the page default', () => {
		expect(scopeErrors(workflowPage('{% commentary id="c" /%}'))).toEqual([]);
	});

	it('flags period without workflow.period', () => {
		expect(scopeErrors('{% commentary id="c" scope="period" /%}')[0]).toContain('workflow.period');
	});

	it('flags an input that is not on the page', () => {
		expect(
			scopeErrors(workflowPage('{% commentary id="c" scope=["period", "fnd"] /%}'))[0]
		).toContain('"fnd" does not exist');
	});

	it('flags a multi-select input', () => {
		expect(
			scopeErrors(
				'{% dropdown id="funds" data="funds" value_column="fund" multiple=true /%}\n\n{% commentary id="c" scope="funds" /%}'
			)[0]
		).toContain('multiple selections');
	});
});
