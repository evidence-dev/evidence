import { describe, it, expect } from 'vitest';
import Markdoc, { type RenderableTreeNode, Tag } from '@markdoc/markdoc';
import { process } from '../../Renderer/MarkdocProcessor/process-markdoc';
import { schema } from './schema';

const findTag = (tree: RenderableTreeNode, name: string): Tag | undefined => {
	if (!Markdoc.Tag.isTag(tree)) return undefined;
	if (tree.name === name) return tree;
	for (const child of tree.children) {
		const found = findTag(child, name);
		if (found) return found;
	}
	return undefined;
};

describe('html markdoc integration', () => {
	it('recovers the raw body into the html prop and drops the children', () => {
		const markdown = `
{% html %}
<div id="viz">hello</div>
<p>more</p>
{% /html %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);

		const tag = findTag(tree, 'html');
		expect(tag).toBeDefined();
		expect(tag!.children).toHaveLength(0);
		expect(typeof tag!.attributes.html).toBe('string');
		expect(tag!.attributes.html).toContain('<div id="viz">hello</div>');
		expect(tag!.attributes.html).toContain('<p>more</p>');
	});

	it('allows <script> and raw HTML in the body (no html-tags-not-allowed)', () => {
		// The whole point of the block. The file-wide html rule must skip the
		// opaque body — driven by bodyLanguage !== "markdoc".
		const markdown = `
{% html %}
<div id="viz"></div>
<script>
	const rows = await evidence.query("orders");
	console.log(rows.length);
</script>
{% /html %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).not.toContain('html-tags-not-allowed');
		expect(validationErrors).toHaveLength(0);
	});

	it('preserves {{ }} template syntax verbatim (no interpolation in the body)', () => {
		// Authors may use Handlebars/Vue/etc. in the body — we must not eat their
		// braces. Data reaches the block through the SDK, not {{ }} substitution.
		const markdown = `
{% html %}
<div>{{ user.name }}</div>
<script>const t = \`hi\`;</script>
{% /html %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);
		const tag = findTag(tree, 'html');
		expect(tag!.attributes.html).toContain('{{ user.name }}');
	});

	it('errors when the body is empty', () => {
		const markdown = `
{% html %}
{% /html %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).toContain('html-missing-body');
	});

	it('passes a variables={…} attribute through to evidence.variables', () => {
		// The variables attribute is how page-level values (frontmatter, filter
		// values, repeat scope, literals) reach the iframe. Markdoc evaluates
		// every value expression BEFORE we see it, so what reaches the tag's
		// transformed attributes is a plain object of already-resolved primitives.
		const markdown = `---
customer: Acme
---

{% html variables={ name=$customer count=7 active=true } %}
<div></div>
<script>evidence.ready();</script>
{% /html %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);

		const tag = findTag(tree, 'html');
		expect(tag).toBeDefined();
		expect(tag!.attributes.variables).toEqual({
			name: 'Acme',
			count: 7,
			active: true
		});
	});

	it('omits variables when the attribute is not present', () => {
		const markdown = `
{% html %}
<div>hi</div>
{% /html %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);

		const tag = findTag(tree, 'html');
		// Absent (rather than empty {}) — Html.svelte's deriver treats both the
		// same, but skipping the attribute keeps the transformed tag minimal.
		expect(tag!.attributes.variables).toBeUndefined();
	});

	it('recovers the body of an html block inside a partial', () => {
		const partials = {
			'widget.md': `
{% html %}
<div id="from-partial">x</div>
{% /html %}
`
		};
		const { tree, validationErrors } = process(
			'{% partial file="widget.md" /%}',
			undefined,
			partials
		);
		expect(validationErrors).toHaveLength(0);
		const tag = findTag(tree, 'html');
		expect(tag).toBeDefined();
		expect(tag!.attributes.html).toContain('<div id="from-partial">x</div>');
	});
});

describe('html schema examples', () => {
	it('schema examples parse without errors', () => {
		for (const { example } of schema.examples) {
			const { validationErrors } = process(example);
			expect(validationErrors, example).toHaveLength(0);
		}
	});
});

describe('explicit variables= contract: teaching hints', () => {
	it('does NOT bridge in-scope values — only variables= entries cross', () => {
		const markdown = `---
customer: Acme
api_token: sk-secret-do-not-leak
---

{% html variables={ label="Spend" } %}
<div></div>
<script>
const l = evidence.variables.label;
const c = evidence.variables.customer;
</script>
{% /html %}`;
		const { tree } = process(markdown);
		const tag = findTag(tree, 'html')!;
		// The tag is the complete manifest: referenced-but-unpassed names and
		// unreferenced frontmatter alike stay out of the iframe.
		expect(tag.attributes.variables).toEqual({ label: 'Spend' });
	});

	it('hints on {{ $x }} tokens anywhere in the body, with the copy-pasteable fix', () => {
		const markdown = `
{% html %}
<h1>{{ $title }}</h1>
<script>
const t = "{{ $speed }}";
</script>
{% /html %}
`;
		const { validationErrors } = process(markdown);
		const hint = validationErrors.find((e) => e.error?.id === 'html-dollar-token');
		expect(hint).toBeDefined();
		expect(hint!.error.level).toBe('warning');
		expect(hint!.error.message).toContain('variables={ title=$title speed=$speed }');
		expect(hint!.error.message).toContain('evidence.variables.title');
		// Points at the markdown alternative for plain text.
		expect(hint!.error.message).toContain('markdown OUTSIDE the block');
	});

	it('hints when the script reads a name the tag does not pass', () => {
		const markdown = `
{% html variables={ label="Spend" } %}
<div></div>
<script>
const { target } = evidence.variables;
draw(evidence.variables.label, evidence.variables.actual);
</script>
{% /html %}
`;
		const { validationErrors } = process(markdown);
		const hint = validationErrors.find((e) => e.error?.id === 'html-variable-not-passed');
		expect(hint).toBeDefined();
		// label is passed → not flagged; target (destructure) and actual (read) are.
		expect(hint!.error.message).toContain('target');
		expect(hint!.error.message).toContain('actual');
		expect(hint!.error.message).not.toContain('label,');
		expect(hint!.error.message).toContain('target=$target');
		expect(hint!.error.message).toContain('actual=$actual');
	});

	it('a block whose reads all match its variables= entries gets no hints', () => {
		const markdown = `
{% html variables={ title="Hi" count=3 } %}
<div></div>
<script>
const { title } = evidence.variables;
use(evidence.variables.count);
</script>
{% /html %}
`;
		const { validationErrors } = process(markdown);
		expect(
			validationErrors.filter(
				(e) => e.error?.id === 'html-variable-not-passed' || e.error?.id === 'html-dollar-token'
			)
		).toEqual([]);
	});
});

describe('opaque bodies are never parsed as markdown', () => {
	it('JS arithmetic across lines produces no softbreak/emphasis warnings', () => {
		const page = `{% html %}
<div id="g"></div>
<script type="module">
	// draw the gauge
	const w = i*80;
	const t = i*0.75;
	const kept = rows.filter((d,i,n) => i*2 < n.length);
	// another comment with *stars* in it
</script>
{% /html %}`;
		const { validationErrors } = process(page);
		expect(validationErrors.filter((e) => e.error?.id === 'child-invalid')).toEqual([]);
	});
});
