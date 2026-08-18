import type { ValidateError } from '@markdoc/markdoc';
import type { ValidationContext } from './types';

type DeprecatedKeyRule = {
	id: string;
	message: string;
	/** Matches the offending top-level frontmatter line (anchored, no indent). */
	test: (line: string) => boolean;
};

const DEPRECATED_KEY_RULES: DeprecatedKeyRule[] = [
	{
		id: 'frontmatter-deprecated-assetId',
		message: 'asset ID is deprecated, you can remove this from the page',
		test: (line) => /^assetId\s*:/.test(line)
	},
	{
		id: 'frontmatter-deprecated-type',
		message: 'type: page is deprecated, you can remove this from the page',
		// Only `type: page` is deprecated — `type: partial` is still meaningful.
		test: (line) => /^type\s*:\s*page\s*$/.test(line)
	},
	{
		id: 'frontmatter-deprecated-name',
		message: 'name is optional and can be removed; use title instead',
		test: (line) => /^name\s*:/.test(line)
	}
];

/**
 * Warn (non-blocking) when a NEW-structure page's frontmatter still carries the
 * deprecated identity fields (`assetId`, `type: page`, `name`). Gated on
 * `useRelativeResolution` so legacy projects — which still consume these fields —
 * never warn.
 *
 * `rawFrontmatter` is the YAML BETWEEN the `---` delimiters. The opening `---` is
 * editor line 0, so a key on frontmatter-string line index `i` (0-based) maps to
 * editor line `i + 1` (mirrors `parseFrontmatter`'s `mark.line + 1` convention).
 * Keys are matched anchored at column 0 so nested keys (e.g. a `name:` indented
 * under a `theme:` block) are not flagged.
 */
export function validateDeprecatedFrontmatterKeys(
	rawFrontmatter: string | undefined,
	context?: ValidationContext
): ValidateError[] {
	if (!context?.useRelativeResolution || !rawFrontmatter) return [];

	const errors: ValidateError[] = [];
	const lines = rawFrontmatter.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Skip indented lines — only top-level frontmatter keys are deprecated.
		if (/^\s/.test(line)) continue;
		for (const rule of DEPRECATED_KEY_RULES) {
			if (!rule.test(line)) continue;
			const editorLine = i + 1;
			errors.push({
				type: 'text',
				lines: [editorLine, editorLine],
				location: {
					start: { line: editorLine, character: 0 },
					end: { line: editorLine, character: line.length }
				},
				error: { id: rule.id, level: 'warning', message: rule.message }
			});
			break; // at most one warning per line
		}
	}
	return errors;
}
