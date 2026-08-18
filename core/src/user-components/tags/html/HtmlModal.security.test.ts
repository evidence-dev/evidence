import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * SECURITY INVARIANT — locks the modal's single author→parent data path.
 *
 * `evidence.modal.open({ title, html })` sends values FROM the opaque-origin
 * sandbox INTO the trusted parent realm. `title` is rendered in the parent
 * (dialog header) and must stay escaped text; `html` must only ever reach the
 * NESTED sandbox, never the parent DOM. Rendering either as raw HTML in the
 * parent would be XSS into the app and defeat the sandbox. HtmlModal therefore
 * must never use `{@html}` — this fails loudly if a refactor introduces it.
 */
describe('HtmlModal: no raw-HTML rendering of sandbox-controlled values', () => {
	it('HtmlModal.svelte never uses {@html}', () => {
		const src = readFileSync(fileURLToPath(new URL('./HtmlModal.svelte', import.meta.url)), 'utf8');
		expect(src).not.toContain('{@html');
	});
});
