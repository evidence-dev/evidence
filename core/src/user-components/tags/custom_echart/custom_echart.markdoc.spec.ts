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

describe('custom_echart markdoc integration', () => {
	it('extracts the raw json body into the config prop and drops the children', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{
  "xAxis": {"type": "category"},
  "series": [{"type": "bar", "label": {"formatter": "+{@inc}"}, "encode": {"x": "category", "y": "total_sales"}}]
}
{% /custom_echart %}
`;
		const { tree, validationErrors } = process(markdown);

		expect(validationErrors).toHaveLength(0);

		const tag = findTag(tree, 'custom_echart');
		expect(tag).toBeDefined();
		expect(tag!.children).toHaveLength(0);
		expect(typeof tag!.attributes.config).toBe('string');
		expect(JSON.parse(tag!.attributes.config)).toEqual({
			xAxis: { type: 'category' },
			series: [
				{
					type: 'bar',
					label: { formatter: '+{@inc}' },
					encode: { x: 'category', y: 'total_sales' }
				}
			]
		});
	});

	it('accepts JSON5 bodies: comments, trailing commas, unquoted keys, single quotes', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{
  // a comment
  xAxis: {type: 'category'},
  series: [
    {type: 'bar', encode: {x: 'category', y: 'total_sales'}},
  ],
}
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);
	});

	it('still accepts a fenced json body', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
\`\`\`json
{ "series": [{ "type": "bar" }] }
\`\`\`
{% /custom_echart %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);

		const tag = findTag(tree, 'custom_echart');
		expect(JSON.parse(tag!.attributes.config)).toEqual({ series: [{ type: 'bar' }] });
	});

	it('recovers the body of a custom_echart inside a partial', () => {
		const partials = {
			'charts.md': `
{% custom_echart data="demo.daily_orders" %}
{ "series": [{ "type": "line" }] }
{% /custom_echart %}
`
		};
		const { tree, validationErrors } = process(
			'{% partial file="charts.md" /%}',
			undefined,
			partials
		);
		expect(validationErrors).toHaveLength(0);

		const tag = findTag(tree, 'custom_echart');
		expect(tag).toBeDefined();
		expect(JSON.parse(tag!.attributes.config)).toEqual({ series: [{ type: 'line' }] });
	});

	it('errors when the body is empty', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).toContain('custom-echart-missing-config');
	});

	it('errors when the body is not valid JSON5', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{ "series": [ }
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).toContain('custom-echart-invalid-config');
	});

	it('errors when the body is valid JSON but not an object', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
[1, 2, 3]
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).toContain('custom-echart-invalid-config');
	});

	it('preserves {{ }} variable syntax in the body for runtime interpolation', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{"series": [{"type": "bar", "name": "{{my_filter.label}}", "encode": {"x": "a", "y": "b"}}]}
{% /custom_echart %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);

		const tag = findTag(tree, 'custom_echart');
		expect(tag!.attributes.config).toContain('{{my_filter.label}}');
	});

	// Regression: a body with multiple JSON `}}` substrings used to false-trigger
	// the "Unbalanced template brackets" check in validateFilterVariables because
	// it walked the Markdoc-parsed children of the tag and ran their text content
	// through interpolateQueryStrings. The bodyLanguage: 'json5' schema field
	// tells text walkers to skip into raw-source bodies.
	it('does not surface bracket-balance errors on bodies with nested JSON closes', () => {
		const markdown = `
{% custom_echart data="orders" %}
{
  "xAxis": {"name": "{{cat.value}}", "type": "category", "axisLabel": {"interval": 0}},
  "yAxis": {"axisLabel": {"formatter": "fmt:usd0m"}},
  "series": [
    {"type": "bar", "stack": "s", "encode": {"x": "step", "y": "value"}},
    {"type": "bar", "stack": "s", "encode": {"x": "step", "y": "tot"}}
  ]
}
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		const messages = validationErrors.map((e) => e.error.message);
		expect(messages.some((m) => m?.includes('Unbalanced'))).toBe(false);
	});

	it('substitutes frontmatter variables in the body at transform time', () => {
		const markdown = `---
title: My Sales Chart
---

{% custom_echart data="demo.daily_orders" %}
{ "title": { "text": "{{ $title }}" }, "series": [{ "type": "bar", "encode": {"x": "a", "y": "b"} }] }
{% /custom_echart %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);
		const tag = findTag(tree, 'custom_echart');
		const parsed = JSON.parse(tag!.attributes.config as string) as {
			title: { text: string };
		};
		expect(parsed.title.text).toBe('My Sales Chart');
	});

	it('substitutes the no-space {{$var}} frontmatter form', () => {
		const markdown = `---
title: My Sales Chart
---

{% custom_echart data="demo.daily_orders" %}
{ "title": { "text": "{{$title}}" }, "series": [{ "type": "bar", "encode": {"x": "a", "y": "b"} }] }
{% /custom_echart %}
`;
		const { tree, validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);
		const tag = findTag(tree, 'custom_echart');
		const parsed = JSON.parse(tag!.attributes.config as string) as {
			title: { text: string };
		};
		expect(parsed.title.text).toBe('My Sales Chart');
	});

	// Auto-detection: the body picks its render mode without the author having
	// to flip a flag. JSON5-shape errors stay in JSON mode (so [1, 2, 3] is a
	// shape error, not silently routed to JS); only JSON5 *syntax* failures
	// route to JS. The `js` attribute remains as an explicit override.
	it('auto-detects JSON mode for a valid JSON5 body without js attribute', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{ "series": [{ "type": "bar", "encode": { "x": "a", "y": "b" } }] }
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);
	});

	it('auto-detects JS mode for a body with function syntax without js attribute', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{
  series: [{
    type: 'bar',
    encode: { x: 'a', y: 'b' },
    label: { color: (p) => p.value >= 0 ? 'green' : 'red' }
  }]
}
{% /custom_echart %}
`;
		// JSON5 syntax fails on `(p) =>` (arrow function not valid in JSON5).
		// JS validation succeeds — should auto-route to JS mode, no error.
		const { validationErrors } = process(markdown);
		expect(validationErrors).toHaveLength(0);
	});

	it('keeps shape errors in JSON mode (does NOT route to JS for [1, 2, 3])', () => {
		// [1, 2, 3] is valid JSON5 syntactically but wrong shape (must be an
		// object). Should surface the shape error, not silently route to JS
		// where it would fail at runtime with a confusing "must return an
		// object" message from inside the sandbox.
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
[1, 2, 3]
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).toContain('custom-echart-invalid-config');
	});

	it('reports invalid-config when a body that opens with { fails both JSON5 and JS', () => {
		// Body opens with `{` → author was writing JSON5. Surface the JSON5
		// parse error (more useful than what JS evaluator would say).
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{ series: [{ formatter: (p => p.value }] }
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		const ids = validationErrors.map((e) => e.error.id);
		expect(ids).toContain('custom-echart-invalid-config');
	});

	it('reports invalid-js when a JS-shaped body has a syntax error', () => {
		// Regression: validateConfigBody used to gate the JS error branch on
		// shouldBeJsMode(), which itself returned true only when JS was
		// already valid. So an invalid-JS body never produced the
		// invalid-js error — authors saw a confusing JSON5 parse message
		// (e.g. "Unexpected character at line 1") instead of the JS error
		// (e.g. "Unexpected token ')'"), making the actual problem hard to
		// spot in the editor.
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
() => {
  const x = ;
  return { series: [] };
}
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		const ids = validationErrors.map((e) => e.error.id);
		expect(ids).toContain('custom-echart-invalid-js');
		expect(ids).not.toContain('custom-echart-invalid-config');
	});

	it('allows HTML tags inside the body (tooltip formatters, label strings, etc.)', () => {
		// Regression: file-wide html-tags-not-allowed rule must NOT apply inside
		// opaque-body tags. ECharts tooltip and label formatters use HTML-in-a-
		// string syntax — `formatter: '<b>{c}</b>'` is the canonical pattern.
		// shouldSkipChildren on opaque-body tags is what makes this work; if
		// the file-wide HTML rule slips back in here (e.g. via a refactor that
		// re-adds validate to textSchema), this test fails loudly.
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{
  tooltip: { formatter: '<b>{b}</b><br/>Value: <span style="color:#22A39F">{c}</span>' },
  series: [{ type: 'bar', encode: { x: 'category', y: 'total' } }]
}
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).not.toContain('html-tags-not-allowed');
		expect(validationErrors).toHaveLength(0);
	});

	it('still rejects HTML tags in plain Markdown text outside any tag', () => {
		// Sanity: the file-wide rule still fires in normal Markdown.
		const markdown = `# Page\n\n<div>raw html</div>\n`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).toContain('html-tags-not-allowed');
	});

	it('flags unknown frontmatter references in the body', () => {
		const markdown = `
{% custom_echart data="demo.daily_orders" %}
{ "title": { "text": "{{ $missing_var }}" }, "series": [{ "type": "bar", "encode": {"x": "a", "y": "b"} }] }
{% /custom_echart %}
`;
		const { validationErrors } = process(markdown);
		expect(validationErrors.map((e) => e.error.id)).toContain('unknown-frontmatter-variable');
		const messages = validationErrors.map((e) => e.error.message ?? '').join('\n');
		expect(messages).toContain('missing_var');
	});
});

describe('schema examples', () => {
	it('schema examples parse without errors', () => {
		for (const { example } of schema.examples) {
			const { validationErrors } = process(example);
			expect(validationErrors, example).toHaveLength(0);
		}
	});
});
