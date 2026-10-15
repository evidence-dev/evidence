import { describe, it, expect } from 'vitest';
import { process } from '../../Renderer/MarkdocProcessor/process-markdoc';

const errorIds = (markdown: string): string[] =>
	process(markdown).validationErrors.map((e) => e.error?.id ?? '');

const workflowPage = (body: string) =>
	`---\ntitle: Ops\nworkflow:\n  period:\n    grain: month\n---\n\n${body}\n`;

describe('period_selector validation', () => {
	it('rejects config on a selector that places the workflow period', () => {
		expect(errorIds(workflowPage('{% period_selector id="period" grain="quarter" /%}'))).toContain(
			'period-selector-workflow-config'
		);
	});

	it('accepts a bare selector that places the workflow period', () => {
		expect(errorIds(workflowPage('{% period_selector id="period" /%}'))).not.toContain(
			'period-selector-workflow-config'
		);
	});

	it('accepts config on an independent selector on a workflow page', () => {
		expect(errorIds(workflowPage('{% period_selector id="q" grain="quarter" /%}'))).not.toContain(
			'period-selector-workflow-config'
		);
	});

	it('accepts config on id="period" when the page has no workflow.period', () => {
		expect(errorIds('{% period_selector id="period" grain="quarter" /%}')).not.toContain(
			'period-selector-workflow-config'
		);
	});
});

describe('period settings validation', () => {
	const frontmatter = (block: string) =>
		`---\ntitle: Ops\nworkflow:\n  period:\n${block}---\n\n# Report\n`;

	it.each([
		['    grain: fortnight\n', 'workflow-period-unknown-grain'],
		['    periods: 0\n', 'workflow-period-invalid-count'],
		['    periods: 501\n', 'workflow-period-count-too-large']
	])('warns about frontmatter that would silently fall back: %s', (block, id) => {
		expect(errorIds(frontmatter(block))).toContain(id);
	});

	it('accepts valid frontmatter without warnings', () => {
		expect(errorIds(frontmatter('    grain: quarter\n    periods: 8\n'))).not.toEqual(
			expect.arrayContaining([expect.stringMatching(/^workflow-period/)])
		);
	});

	it.each([0, 501, 2.5])('rejects periods=%s on the tag', (periods) => {
		expect(errorIds(`{% period_selector id="q" periods=${periods} /%}`)).toContain(
			'period-selector-invalid-periods'
		);
	});

	it('warns when id="period" is used on a page without workflow.period', () => {
		expect(errorIds('{% period_selector id="period" /%}')).toContain('period-selector-reserved-id');
		expect(errorIds(workflowPage('{% period_selector id="period" /%}'))).not.toContain(
			'period-selector-reserved-id'
		);
	});

	it('warns instead of failing for flow-style frontmatter', () => {
		expect(
			errorIds('---\ntitle: Ops\nworkflow: {period: {grain: fortnight}}\n---\n\n# Report\n')
		).toContain('workflow-period-unknown-grain');
	});
});
