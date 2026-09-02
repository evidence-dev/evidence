import { describe, it, expect } from 'vitest';
import { projectRootPageFrontmatterSchema } from './page-frontmatter-schema';
import { parseWorkflowPeriod, workflowPeriodWarnings } from './workflow-frontmatter';
import { DEFAULT_PERIOD_COUNT } from '../user-components/common/reporting-periods';

const parse = (fm: unknown) => projectRootPageFrontmatterSchema.parse(fm);

describe('workflow frontmatter schema', () => {
	it('parses a full period block', () => {
		expect(parse({ workflow: { period: { grain: 'quarter', periods: 8 } } }).workflow).toEqual({
			period: { grain: 'quarter', periods: 8 }
		});
	});

	it('accepts an empty period block — presence is the switch', () => {
		expect(parse({ workflow: { period: {} } }).workflow).toEqual({ period: {} });
	});

	it('drops only the bad value, keeping the rest of the page settings', () => {
		const result = parse({ title: 'Ops', cards: true, workflow: { period: { grain: 42 } } });
		expect(result.title).toBe('Ops');
		expect(result.cards).toBe(true);
		expect(result.workflow?.period?.grain).toBeUndefined();
	});

	it('leaves pages without a workflow block untouched', () => {
		expect(parse({ title: 'Plain' }).workflow).toBeUndefined();
	});
});

describe('parseWorkflowPeriod', () => {
	it('returns the period config when the block is present', () => {
		expect(parseWorkflowPeriod({ workflow: { period: { grain: 'week', periods: 4 } } })).toEqual({
			grain: 'week',
			periods: 4
		});
	});

	it('returns an empty config for a bare period block, so defaults apply', () => {
		expect(parseWorkflowPeriod({ workflow: { period: null } })).toEqual({});
		expect(parseWorkflowPeriod({ workflow: { period: {} } })).toEqual({});
	});

	it('returns undefined when there is no period block', () => {
		expect(parseWorkflowPeriod({})).toBeUndefined();
		expect(parseWorkflowPeriod({ workflow: {} })).toBeUndefined();
		expect(parseWorkflowPeriod({ workflow: 'nope' })).toBeUndefined();
		expect(parseWorkflowPeriod(undefined)).toBeUndefined();
	});
});

describe('workflowPeriodWarnings', () => {
	it('warns about an unrecognized grain rather than silently defaulting', () => {
		const warnings = workflowPeriodWarnings({ workflow: { period: { grain: 'fortnight' } } });
		expect(warnings).toHaveLength(1);
		expect(warnings[0].level).toBe('warning');
		expect(warnings[0].message).toContain('fortnight');
		expect(warnings[0].message).toContain('month');
	});

	it('warns about a non-positive period count', () => {
		expect(workflowPeriodWarnings({ workflow: { period: { periods: 0 } } })).toHaveLength(1);
		expect(workflowPeriodWarnings({ workflow: { period: { periods: -3 } } })).toHaveLength(1);
	});

	it('stays silent for a valid block and for pages with no workflow', () => {
		expect(
			workflowPeriodWarnings({ workflow: { period: { grain: 'month', periods: 6 } } })
		).toEqual([]);
		expect(workflowPeriodWarnings({ workflow: { period: {} } })).toEqual([]);
		expect(workflowPeriodWarnings({})).toEqual([]);
	});
});

describe('workflow.period.periods bounds', () => {
	it('drops an out-of-range count so the default applies', () => {
		// `.catch(undefined)` keeps the page working; the warning tells the author.
		expect(parseWorkflowPeriod({ workflow: { period: { periods: 1e9 } } })).toEqual({
			periods: undefined
		});
		expect(parseWorkflowPeriod({ workflow: { period: { periods: 0 } } })).toEqual({
			periods: undefined
		});
	});

	it('warns when the count exceeds the cap, naming the real fallback', () => {
		const warnings = workflowPeriodWarnings({ workflow: { period: { periods: 5000 } } });
		expect(warnings).toHaveLength(1);
		expect(warnings[0].id).toBe('workflow-period-count-too-large');
		// The schema drops a rejected value, so the picker shows the default count
		// rather than the cap — the warning must say so.
		expect(warnings[0].message).toContain('fall back to 12 periods');
		expect(warnings[0].message).not.toContain('will offer 500');
	});

	it('warns for a fractional count, naming the real fallback', () => {
		const warnings = workflowPeriodWarnings({ workflow: { period: { periods: 2.5 } } });
		expect(warnings).toHaveLength(1);
		expect(warnings[0].message).toContain('fall back to 12 periods');
	});

	it('the warned fallback matches what the schema actually yields', () => {
		for (const periods of [0, -3, 2.5, 5000]) {
			expect(parseWorkflowPeriod({ workflow: { period: { periods } } })).toEqual({
				periods: undefined
			});
			expect(workflowPeriodWarnings({ workflow: { period: { periods } } })[0].message).toContain(
				`fall back to ${DEFAULT_PERIOD_COUNT} periods`
			);
		}
	});

	it('accepts a count at the cap', () => {
		expect(workflowPeriodWarnings({ workflow: { period: { periods: 500 } } })).toEqual([]);
	});
});
