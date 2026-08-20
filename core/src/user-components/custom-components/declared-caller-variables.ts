import { parseFrontmatter } from '../../utils/parseFrontmatter';
import { parseCustomComponentAttributes } from './component-attribute-schema';

/**
 * Derive the { attribute name → declared default } map from a component
 * FILE's raw content. Injected as known variables when the file is validated
 * standalone (editor, commit gate, chat pre-stage validation) so a body
 * `{{ $title }}` validates when `title` is declared, while a typo
 * `{{ $titel }}` still errors — the schema-aware alternative to the blanket
 * suppression partials need.
 *
 * `\r?\n` keeps CRLF-committed files working (an LF-only match would return
 * no attributes and every `$attr` ref would false-fire as undefined).
 */
export function declaredCallerVariablesFromContent(content: string): Record<string, unknown> {
	const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	const { frontmatter } = parseFrontmatter(frontmatterMatch?.[1]);
	const attrs = parseCustomComponentAttributes(frontmatter.attributes);
	const out: Record<string, unknown> = {};
	for (const [name, decl] of Object.entries(attrs)) {
		out[name] = decl.default ?? '';
	}
	return out;
}
