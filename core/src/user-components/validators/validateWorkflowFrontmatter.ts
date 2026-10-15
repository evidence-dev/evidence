import type { ValidateError } from '@markdoc/markdoc';
import { parseFrontmatter } from '../../utils/parseFrontmatter';
import { workflowPeriodWarnings } from '../../config/workflow-frontmatter';

const KEY_FOR_WARNING: Record<string, string> = {
	'workflow-period-unknown-grain': 'grain',
	'workflow-period-invalid-count': 'periods',
	'workflow-period-count-too-large': 'periods'
};

/** Surface `workflow.period` values the schema silently replaces with defaults. */
export function validateWorkflowFrontmatter(rawFrontmatter: string | undefined): ValidateError[] {
	if (!rawFrontmatter) return [];
	const warnings = workflowPeriodWarnings(parseFrontmatter(rawFrontmatter).frontmatter);
	if (warnings.length === 0) return [];

	const lines = rawFrontmatter.split('\n');
	const indent = (line: string) => line.length - line.trimStart().length;
	const workflowLine = lines.findIndex((line) => /^workflow\s*:/.test(line));
	const periodLine = lines.findIndex((line, i) => i > workflowLine && /^\s+period\s*:/.test(line));
	// The `period:` block ends at the first non-blank line indented no deeper than `period:` itself.
	// Flow-style YAML (`workflow: {period: {...}}`) has no such line; point at the fallback instead.
	const blockEnd =
		periodLine === -1
			? -1
			: lines.findIndex(
					(line, i) =>
						i > periodLine && line.trim() !== '' && indent(line) <= indent(lines[periodLine])
				);
	const lastLine = periodLine === -1 ? -1 : blockEnd === -1 ? lines.length : blockEnd;
	return warnings.map((warning) => {
		const key = KEY_FOR_WARNING[warning.id];
		const index = lines.findIndex(
			(line, i) => i > periodLine && i < lastLine && new RegExp(`^\\s+${key}\\s*:`).test(line)
		);
		// The opening `---` is editor line 0, so frontmatter line i is editor line i + 1.
		const editorLine = (index >= 0 ? index : Math.max(periodLine, workflowLine, 0)) + 1;
		const text = lines[editorLine - 1] ?? '';
		return {
			type: 'text',
			lines: [editorLine, editorLine],
			location: {
				start: { line: editorLine, character: 0 },
				end: { line: editorLine, character: text.length }
			},
			error: warning
		};
	});
}
