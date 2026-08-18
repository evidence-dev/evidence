import { describe, it, expect } from 'vitest';
import {
	parseCustomComponentAttributes,
	parseCustomComponentAttributesWithErrors
} from './component-attribute-schema';
import { parseCustomComponentMeta, buildCustomComponentRegistry } from './build-custom-tags';

describe('parseCustomComponentAttributes', () => {
	it('rejects the removed shorthand with a message teaching the type: block form', () => {
		// `data: query` used to be shorthand for the type; there is now exactly
		// ONE declaration syntax. The error suggests the `type:` block with the
		// typed string as the type (since it IS a valid type name).
		const { attributes, errors } = parseCustomComponentAttributesWithErrors({
			data: 'query'
		});
		expect(attributes).toEqual({});
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('type: query');
	});

	it('parses longhand declarations', () => {
		const result = parseCustomComponentAttributes({
			fmt: { type: 'format', default: 'usd' },
			y: { type: 'column', required: true, description: 'value' }
		});
		expect(result.fmt).toEqual({
			type: 'format',
			required: false,
			default: 'usd',
			description: undefined
		});
		expect(result.y).toEqual({
			type: 'column',
			required: true,
			default: undefined,
			description: 'value'
		});
	});

	it('returns empty object for non-object input', () => {
		expect(parseCustomComponentAttributes(undefined)).toEqual({});
		expect(parseCustomComponentAttributes(null)).toEqual({});
		expect(parseCustomComponentAttributes('not-an-object')).toEqual({});
		expect(parseCustomComponentAttributes([])).toEqual({});
	});

	it('drops unknown type strings rather than crashing', () => {
		const result = parseCustomComponentAttributes({ bad: 'not-a-real-type' });
		expect(result).toEqual({});
	});

	it('keeps valid entries when a sibling entry is invalid (no all-or-nothing wipe)', () => {
		const result = parseCustomComponentAttributes({
			data: { type: 'query' },
			x: { type: 'integer' }, // unsupported type
			title: { type: 'string', default: '' }
		});
		// The bad `x` drops out, but `data` and `title` survive.
		expect(Object.keys(result).sort()).toEqual(['data', 'title']);
		expect(result.data).toEqual({
			type: 'query',
			required: false,
			default: undefined,
			description: undefined,
			options: undefined
		});
	});

	it('reports an error per invalid entry via …WithErrors', () => {
		const { attributes, errors } = parseCustomComponentAttributesWithErrors({
			data: { type: 'query' },
			x: { type: 'integer' },
			y: { notType: true }
		});
		expect(Object.keys(attributes)).toEqual(['data']);
		expect(errors).toHaveLength(2);
		expect(errors.some((e) => e.name === 'x' && e.message.includes('"x"'))).toBe(true);
		expect(errors.some((e) => e.name === 'y' && e.message.includes('"y"'))).toBe(true);
	});

	it('a string that was meant as a default teaches the type: + default: form', () => {
		const { errors } = parseCustomComponentAttributesWithErrors({ value: 'total' });
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('default: total');
	});
});

describe('parseCustomComponentMeta', () => {
	it('reads description and attributes out of frontmatter', () => {
		const content = `---
type: component
description: A custom bar chart
attributes:
  data:
    type: query
    required: true
  x:
    type: column
---
{% bar_chart data=$data x="{{x}}" /%}`;
		const meta = parseCustomComponentMeta('components/my_bar', content);
		expect(meta.tagName).toBe('my_bar');
		expect(meta.fullPath).toBe('components/my_bar');
		expect(meta.description).toBe('A custom bar chart');
		expect(meta.attributes.data.type).toBe('query');
		expect(meta.attributes.data.required).toBe(true);
		expect(meta.attributes.x.type).toBe('column');
	});

	it('parses frontmatter even with Windows CRLF line endings', () => {
		// A CRLF-committed component must still get its attribute schema — an
		// LF-only regex would return no frontmatter, dropping every attribute.
		const content =
			'---\r\ntype: component\r\nattributes:\r\n  data:\r\n    type: query\r\n---\r\n{% bar_chart data=$data /%}';
		const meta = parseCustomComponentMeta('components/my_bar', content);
		expect(meta.attributes.data?.type).toBe('query');
	});

	it('falls back to filename for the tag when no frontmatter', () => {
		const meta = parseCustomComponentMeta('components/footer', '# hello');
		expect(meta.tagName).toBe('footer');
		expect(meta.attributes).toEqual({});
	});

	it('uses the basename for nested paths', () => {
		const meta = parseCustomComponentMeta('components/charts/bar', '');
		expect(meta.tagName).toBe('bar');
	});
});

describe('buildCustomComponentRegistry', () => {
	const reserved = new Set(['bar_chart', 'line_chart']);

	it('builds a tag schema with the declared attributes', () => {
		const content = `---
type: component
attributes:
  data:
    type: query
  x:
    type: column
  y:
    type: column
    required: true
---
{% bar_chart data=$data x="{{x}}" y="{{y}}" /%}`;
		const { tags, meta, collisions } = buildCustomComponentRegistry(
			{ 'components/my_bar': content },
			reserved
		);
		expect(collisions).toEqual([]);
		expect(tags.my_bar).toBeDefined();
		expect(meta.my_bar.attributes.y.required).toBe(true);

		const schema = tags.my_bar;
		expect(schema.attributes?.data).toMatchObject({
			type: String,
			suggestionType: 'table',
			affectsQuery: true
		});
		expect(schema.attributes?.x).toMatchObject({ suggestionType: 'column' });
		expect(schema.attributes?.y).toMatchObject({ required: true });
	});

	it('drops components that collide with a built-in tag', () => {
		const { tags, collisions } = buildCustomComponentRegistry(
			{ 'components/bar_chart': '---\ntype: component\n---\nbody' },
			reserved
		);
		expect(tags.bar_chart).toBeUndefined();
		expect(collisions).toEqual([
			{ tagName: 'bar_chart', fullPath: 'components/bar_chart', collidesWith: 'builtin' }
		]);
	});

	it('flags BOTH sides of a sibling collision (not just the dropped one)', () => {
		// Critical: the file that wins the registry slot also has to know
		// it's in a collision so the editor can surface a "tag name X is
		// also defined by Y" warning. Without this, the author of the
		// winning file sees no diagnostic and has no idea their tag is
		// shadowing another file in the project.
		const { tags, collisions } = buildCustomComponentRegistry(
			{
				'components/my_bar': '---\ntype: component\n---\nv1',
				'components/charts/my_bar': '---\ntype: component\n---\nv2'
			},
			reserved
		);
		expect(tags.my_bar).toBeDefined();
		const sortedCollisions = collisions
			.slice()
			.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
		expect(sortedCollisions).toEqual([
			{
				tagName: 'my_bar',
				fullPath: 'components/charts/my_bar',
				collidesWith: 'component'
			},
			{
				tagName: 'my_bar',
				fullPath: 'components/my_bar',
				collidesWith: 'component'
			}
		]);
	});

	it('exposes selfClosing schemas (no children expected)', () => {
		const { tags } = buildCustomComponentRegistry(
			{ 'components/foo': '---\ntype: component\n---\n' },
			reserved
		);
		expect(tags.foo.selfClosing).toBe(true);
	});

	it('maps date_range / comparison / filter to their suggestionType + bodyProperties', () => {
		// The registry refactor unifies all "complex" typed attributes
		// behind one definition. Pin the contract that the three call-site
		// hints flow through correctly: suggestionType for the editor
		// dropdown on the value, supportsVariables for `{{ filter.x }}`
		// interpolation, bodyProperties for the future `.prop` autocomplete.
		const content = `---
type: component
attributes:
  period:
    type: date_range
  compare:
    type: comparison
  filterRef:
    type: filter
---
body`;
		const { tags } = buildCustomComponentRegistry({ 'components/widget': content }, new Set());
		expect(tags.widget.attributes?.period).toMatchObject({
			type: String,
			suggestionType: 'date_range',
			supportsVariables: true
		});
		expect(tags.widget.attributes?.compare).toMatchObject({
			type: String,
			suggestionType: 'comparison'
		});
		expect(tags.widget.attributes?.filterRef).toMatchObject({
			type: String,
			suggestionType: 'filter'
		});
	});

	it('translates `options:` into Markdoc `matches` for enum-style attributes', () => {
		// One-of constraint via a friendly `options: [...]` block in
		// frontmatter. Maps to Markdoc's existing `matches` mechanism so
		// the editor's value-autocomplete (which already knows about
		// `matches`) surfaces the options without extra wiring.
		const content = `---
type: component
attributes:
  align:
    type: string
    options: [top, middle, bottom]
    default: middle
---
body`;
		const { tags } = buildCustomComponentRegistry({ 'components/aligned': content }, new Set());
		expect(tags.aligned.attributes?.align).toMatchObject({
			type: String,
			matches: ['top', 'middle', 'bottom'],
			default: 'middle'
		});
	});

	it('passes options through validation: Markdoc accepts in-set values', () => {
		// Smoke-check the integration: a component with options + a
		// matching call-site value should produce no Markdoc-validation
		// errors specific to the value constraint.
		const componentContent = `---
type: component
attributes:
  align:
    type: string
    options: [top, middle, bottom]
---
body`;
		const { tags } = buildCustomComponentRegistry(
			{ 'components/aligned': componentContent },
			new Set()
		);
		expect(tags.aligned.attributes?.align?.matches).toEqual(['top', 'middle', 'bottom']);
	});
});
