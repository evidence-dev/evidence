import type { ValidateError } from '@markdoc/markdoc';
import type { ValidationContext } from './types';
import { availableIconNames } from '../common/icon-names';

const VALID_ICON_NAMES = new Set<string>(availableIconNames);

/** Mirror `loadLucideIcon`'s normalization: lowercase, `_`/whitespace → `-`. */
function normalizeIconName(value: string): string {
	return value.toLowerCase().replace(/[_\s]/g, '-');
}

/**
 * Warn (non-blocking) when a NEW-structure page's frontmatter sets `icon:` to a
 * name that isn't in the curated icon set. The frontmatter schema silently
 * drops an unknown icon (`.catch(undefined)`), so without this warning a typo'd
 * icon name just renders nothing with no explanation. Gated on
 * `useRelativeResolution` so legacy projects never warn.
 *
 * `rawFrontmatter` is the YAML BETWEEN the `---` delimiters. The opening `---`
 * is editor line 0, so a key on frontmatter-string line index `i` (0-based)
 * maps to editor line `i + 1` (mirrors `validateDeprecatedFrontmatterKeys`).
 * Only a top-level `icon:` (column 0) is checked so a nested `icon:` under
 * another block isn't flagged.
 */
export function validateInvalidIconName(
	rawFrontmatter: string | undefined,
	context?: ValidationContext
): ValidateError[] {
	if (!context?.useRelativeResolution || !rawFrontmatter) return [];

	const errors: ValidateError[] = [];
	const lines = rawFrontmatter.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		// Skip indented lines — only the top-level page `icon:` is validated.
		if (/^\s/.test(line)) continue;
		const match = /^icon\s*:\s*(.*)$/.exec(line);
		if (!match) continue;

		// Strip a trailing comment, surrounding quotes, and whitespace.
		let raw = match[1].replace(/\s+#.*$/, '').trim();
		if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
			raw = raw.slice(1, -1);
		}

		// An empty value / explicit null means "no icon" — valid.
		if (raw === '' || raw === 'null' || raw === '~') continue;
		if (VALID_ICON_NAMES.has(normalizeIconName(raw))) continue;

		const editorLine = i + 1;
		errors.push({
			type: 'text',
			lines: [editorLine, editorLine],
			location: {
				start: { line: editorLine, character: 0 },
				end: { line: editorLine, character: line.length }
			},
			error: {
				id: 'frontmatter-invalid-icon',
				level: 'warning',
				message: `\`${raw}\` is not a valid icon name`
			}
		});
	}
	return errors;
}
