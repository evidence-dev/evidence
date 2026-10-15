import { describe, expect, it } from 'vitest';
import { validateWorkflowFrontmatter } from './validateWorkflowFrontmatter';

describe('validateWorkflowFrontmatter', () => {
	it('points the warning at the offending key', () => {
		// Frontmatter line 3 (0-based) is editor line 4: the opening `---` is editor line 0.
		const [warning] = validateWorkflowFrontmatter(
			'title: Ops\nworkflow:\n  period:\n    grain: fortnight\n'
		);
		expect(warning.error.id).toBe('workflow-period-unknown-grain');
		expect(warning.lines).toEqual([4, 4]);
	});

	it('returns nothing for pages without workflow.period', () => {
		expect(validateWorkflowFrontmatter('title: Ops\n')).toEqual([]);
	});

	it('ignores the same key in another workflow block', () => {
		const [warning] = validateWorkflowFrontmatter(
			'workflow:\n  release:\n    grain: month\n  period:\n    grain: fortnight\n'
		);
		expect(warning.lines).toEqual([5, 5]);
	});

	it('handles flow-style YAML without throwing', () => {
		const [warning] = validateWorkflowFrontmatter(
			'title: Ops\nworkflow: {period: {grain: fortnight}}\n'
		);
		expect(warning.error.id).toBe('workflow-period-unknown-grain');
		expect(warning.lines).toEqual([2, 2]);
	});
});
