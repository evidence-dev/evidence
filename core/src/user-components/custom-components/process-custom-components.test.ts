import { describe, test, expect } from 'vitest';
import { process } from '../Renderer/MarkdocProcessor/process-markdoc';
import type { ValidationContext } from '../validators/types';
import { InlineQueries } from '../common/inline-queries';
import { Filters } from '../../Filters.svelte';
import { parseCustomComponentMeta } from './build-custom-tags';

const ctx = (over: Partial<ValidationContext> = {}): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined,
	...over
});

const treeText = (tree: ReturnType<typeof process>['tree']): string => JSON.stringify(tree);

describe('Custom components — end-to-end', () => {
	test('a custom component tag inlines its body at the call site', () => {
		const components = {
			'components/hello': `---
type: component
---

GREETING_FROM_HELLO`
		};
		const { validationErrors, tree } = process(
			'{% hello /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		// Body shows up at the call site.
		expect(treeText(tree)).toContain('GREETING_FROM_HELLO');
		// And there are no "unknown tag" errors for the custom tag.
		expect(validationErrors.find((e) => e.error?.message?.includes('hello'))).toBeUndefined();
	});

	test('attribute values are exposed as $variables inside the body', () => {
		const components = {
			'components/badge': `---
type: component
attributes:
  label:
    type: string
---

LABEL_IS_{{ $label }}`
		};
		const { tree } = process(
			'{% badge label="green" /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(treeText(tree)).toContain('LABEL_IS_green');
	});

	test('declared defaults are applied when the attribute is omitted', () => {
		const components = {
			'components/badge': `---
type: component
attributes:
  label:
    type: string
    default: fallback
---

LABEL_IS_{{ $label }}`
		};
		const { tree } = process(
			'{% badge /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(treeText(tree)).toContain('LABEL_IS_fallback');
	});

	test('call-site values override declared defaults', () => {
		const components = {
			'components/badge': `---
type: component
attributes:
  label:
    type: string
    default: fallback
---

LABEL_IS_{{ $label }}`
		};
		const { tree } = process(
			'{% badge label="overridden" /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(treeText(tree)).toContain('LABEL_IS_overridden');
		expect(treeText(tree)).not.toContain('fallback');
	});

	test('a component whose name collides with a built-in (e.g. value) is ignored', () => {
		const components = {
			'components/value': `---
type: component
---

CUSTOM_VALUE_BODY`
		};
		// `value` is a built-in tag — the custom one should be dropped, so the
		// built-in `{% value /%}` schema is what validates here. The built-in
		// requires attributes, so we'll get a validation error, NOT our body
		// inlined.
		const { tree } = process(
			'{% value data="orders" column="total" /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(treeText(tree)).not.toContain('CUSTOM_VALUE_BODY');
	});

	test('a custom component can be called multiple times on a page', () => {
		const components = {
			'components/my_note': `---
type: component
attributes:
  text:
    type: string
---

NOTE[{{ $text }}]`
		};
		const { tree } = process(
			'{% my_note text="one" /%}\n\n{% my_note text="two" /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		const json = treeText(tree);
		expect(json).toContain('NOTE[one]');
		expect(json).toContain('NOTE[two]');
	});

	test('MarkdocProcessor surfaces the registry keyed by tag name (not full path)', async () => {
		// Regression: Monaco's syntax highlighter + the attribute autocomplete
		// both read tag names from the processor. Before the fix they read
		// `Object.keys(customComponents)` which holds `components/my_bar`
		// (full project-root path) — that slashed string then went into
		// Monarch's tag-name regex alternation, breaking highlighting; and
		// the autocomplete looked up `tags['my_bar']` against the static
		// registry only, missing the per-project schemas. Surfacing the
		// post-registry map keyed by tag name fixes both.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			customComponents: {
				'components/my_bar': `---
type: component
attributes:
  data:
    type: query
    required: true
---
{% bar_chart data=$data x="m" y="v" /%}`,
				'components/nested/widget': `---
type: component
---
body`
			}
		});

		// Keys are bare tag names (basenames) — no `components/` prefix, no slashes
		expect(Object.keys(processor.customComponentTags).sort()).toEqual(['my_bar', 'widget']);
		// Each entry is a usable Markdoc schema with the declared attributes
		expect(processor.customComponentTags.my_bar.attributes?.data).toMatchObject({
			required: true,
			suggestionType: 'table'
		});
		// Meta is exposed too (used by the AI tool surface + future hovers)
		expect(processor.customComponentMeta.my_bar.attributes.data.type).toBe('query');
	});

	test('component: declared $attr refs validate cleanly (no caller-injected false positive)', async () => {
		// When the user is editing the component file itself (no call site),
		// the validator has to know what `$title` will be — and it does,
		// because `title` is declared in the component's `attributes:` block.
		// The processor injects the declared attribute names into the known-
		// variables set so the validator runs against an accurate schema.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const componentBody = `---
type: component
attributes:
  title:
    type: string
---

# {{ $title }}`;

		const asPage = new MarkdocProcessor({ content: componentBody, standaloneFileType: 'page' });
		// As a page, the validator has no schema and `$title` reads as undefined.
		expect(
			asPage.validationErrors.some((e) => e.error?.id === 'undefined-frontmatter-variable')
		).toBe(true);

		const asComponent = new MarkdocProcessor({
			content: componentBody,
			standaloneFileType: 'component'
		});
		// As a component, `title` is declared → ref is valid → no error.
		expect(
			asComponent.validationErrors.some((e) => e.error?.id === 'undefined-frontmatter-variable')
		).toBe(false);
	});

	test('component: typo in $attr ref STILL errors (the suppression-vs-schema win)', async () => {
		// The whole reason for schema-driven validation over blanket
		// suppression: a typo like `$titel` (when only `title` is declared)
		// must still squiggle. Blanket suppression would let this through
		// silently and the author would never see the bug until a page
		// rendered the component empty.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
attributes:
  title:
    type: string
---

# {{ $titel }}`,
			standaloneFileType: 'component'
		});
		const undef = processor.validationErrors.find(
			(e) => e.error?.id === 'undefined-frontmatter-variable'
		);
		expect(undef).toBeDefined();
		expect(undef?.error?.message).toContain('titel');
	});

	test('component: declared attributes are detected reactively as frontmatter changes', async () => {
		// Editor experience: typing a new attribute declaration should
		// instantly make its `$name` legal in the body without a reload.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
attributes:
  title:
    type: string
---

# {{ $subtitle }}`,
			standaloneFileType: 'component'
		});
		// `subtitle` not declared yet → undefined.
		expect(
			processor.validationErrors.some((e) => e.error?.id === 'undefined-frontmatter-variable')
		).toBe(true);

		// Add `subtitle` to the attributes block — same processor instance.
		processor.markdown = `---
type: component
attributes:
  title:
    type: string
  subtitle:
    type: string
---

# {{ $subtitle }}`;

		expect(
			processor.validationErrors.some((e) => e.error?.id === 'undefined-frontmatter-variable')
		).toBe(false);
	});

	test('component: declared `default:` values render in the preview when editing standalone', () => {
		// The author writes `default: 'orders'` on an attribute and expects
		// the component preview (no host page) to render with that stand-in
		// value. Before the fix, defaults were nested inside
		// `attributes.<name>.default` in the parsed frontmatter — never
		// hoisted to a top-level variable — so `$data` in the body resolved
		// to undefined and the preview showed an unconfigured render.
		const body = `---
type: component
attributes:
  data:
    type: query
    default: orders
  title:
    type: string
    default: Q4 Sales
---

# {{ $title }}

DATA_VALUE={{ $data }}`;
		const { tree } = process(
			body,
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			// Direct-equivalent of what MarkdocProcessor derives from the
			// component's frontmatter when editing standalone.
			{ data: 'orders', title: 'Q4 Sales' }
		);
		const json = JSON.stringify(tree);
		expect(json).toContain('Q4 Sales');
		expect(json).toContain('DATA_VALUE=orders');
	});

	test('component: attributes without a `default:` render as empty (no crash)', () => {
		// A required attribute without a default has nothing to substitute
		// in standalone preview — must render as empty, not crash, not
		// surface as undefined. Authors can add a default if they want a
		// stand-in value visible in the preview.
		const body = `---
type: component
attributes:
  title:
    type: string
    required: true
---

T=[{{ $title }}]`;
		const { tree } = process(body, ctx(), undefined, undefined, undefined, undefined, undefined, {
			title: ''
		});
		expect(JSON.stringify(tree)).toContain('T=[]');
	});

	test('component: standalone validation still surfaces real Markdoc errors', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const broken = new MarkdocProcessor({
			content: `---
type: component
---

{% unknown_tag /%}`,
			standaloneFileType: 'component'
		});
		// Real Markdoc errors (unknown tag, here) survive the standalone
		// path — only the caller-context error IDs were ever in scope for
		// suppression.
		expect(broken.validationErrors.map((e) => e.error?.id)).toContain('tag-undefined');
	});

	test('standalone component file surfaces a collision warning when its name shadows a built-in', async () => {
		// Without this, the author renames their file to e.g. `value.md`,
		// saves, sees no error, and is then mystified that every page that
		// calls `{% value /%}` gets the built-in's behavior instead of their
		// custom one. Surfacing it on the component file itself is the only
		// place an author would think to look.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: '---\ntype: component\n---\nbody',
			standaloneFileType: 'component',
			customComponents: { 'components/value': '---\ntype: component\n---\nbody' },
			validationContext: {
				metadata: undefined,
				filters: undefined,
				inlineQueries: undefined,
				trees: undefined,
				basePath: 'components/value'
			}
		});
		const collision = processor.validationErrors.find(
			(e) => e.error?.id === 'custom-component-name-collision'
		);
		expect(collision).toBeDefined();
		expect(collision?.error?.message).toContain('built-in');
	});

	test('standalone component file surfaces a collision when another sibling has the same basename', async () => {
		// Both sides need the warning — the file that "wins" the registry
		// slot is still in a collision and the author needs to know.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const customComponents = {
			'components/my_bar': '---\ntype: component\n---\nv1',
			'components/charts/my_bar': '---\ntype: component\n---\nv2'
		};

		const winningSide = new MarkdocProcessor({
			content: '---\ntype: component\n---\nv1',
			standaloneFileType: 'component',
			customComponents,
			validationContext: {
				metadata: undefined,
				filters: undefined,
				inlineQueries: undefined,
				trees: undefined,
				basePath: 'components/my_bar'
			}
		});
		expect(
			winningSide.validationErrors.find((e) => e.error?.id === 'custom-component-name-collision')
		).toBeDefined();

		const losingSide = new MarkdocProcessor({
			content: '---\ntype: component\n---\nv2',
			standaloneFileType: 'component',
			customComponents,
			validationContext: {
				metadata: undefined,
				filters: undefined,
				inlineQueries: undefined,
				trees: undefined,
				basePath: 'components/charts/my_bar'
			}
		});
		expect(
			losingSide.validationErrors.find((e) => e.error?.id === 'custom-component-name-collision')
		).toBeDefined();
	});

	test('component with a unique name fires no collision error', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: '---\ntype: component\n---\nbody',
			standaloneFileType: 'component',
			customComponents: {
				'components/uniquely_named_thing': '---\ntype: component\n---\nbody'
			},
			validationContext: {
				metadata: undefined,
				filters: undefined,
				inlineQueries: undefined,
				trees: undefined,
				basePath: 'components/uniquely_named_thing'
			}
		});
		expect(
			processor.validationErrors.find((e) => e.error?.id === 'custom-component-name-collision')
		).toBeUndefined();
	});

	test('component: variables getter exposes bodyProperties for typed attrs (autocomplete)', async () => {
		// The editor's variable-suggestion code walks `processor.variables`
		// with lodash `get` to surface `{{ $attr.prop }}` completions. For
		// typed attributes (date_range, comparison, filter) we synthesize
		// an object shape so the prop names show up — without this the
		// author has to know the schema by heart. Pins the contract that
		// `$period.start` autocompletes when `period: date_range`.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
attributes:
  period:
    type: date_range
  compare:
    type: comparison
  ref:
    type: filter
  data:
    type: query
---
body`,
			standaloneFileType: 'component'
		});
		const vars = processor.variables as Record<string, unknown>;
		expect(vars.period).toEqual(
			expect.objectContaining({
				start: expect.any(String),
				end: expect.any(String),
				label: expect.any(String)
			})
		);
		expect(vars.compare).toEqual(
			expect.objectContaining({
				start: expect.any(String),
				end: expect.any(String),
				label: expect.any(String)
			})
		);
		expect(vars.ref).toEqual(
			expect.objectContaining({ selected: expect.any(String), literal: expect.any(String) })
		);
		// Scalar types (no bodyProperties) don't get the shape augmentation —
		// `data: query` resolves to a single string value, no `.prop` access.
		expect(typeof vars.data).not.toBe('object');
	});

	test('component: SCALAR declared attributes appear in variables so {{ autocomplete offers them', async () => {
		// Regression: only bodyProperties types (date_range, comparison, filter)
		// were surfaced, so a plain `value: { type: column }` never showed up
		// when the author typed `{{` in the component body. Scalars surface as
		// bare names, with the declared default as the suggestion preview.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
attributes:
  value:
    type: column
    default: total
  title:
    type: string
---
body`,
			standaloneFileType: 'component'
		});
		const vars = processor.variables as Record<string, unknown>;
		expect(vars.value).toBe('total'); // declared default as preview
		expect(vars.title).toBe('string'); // no default → falls back to the type
	});

	test('component: flags misnested attribute declarations (column-0 instead of under attributes:)', async () => {
		// Real footgun: YAML indentation. Author types
		//   attributes:
		//     data: query
		//   color:                ← at column 0, not nested
		//     type: string
		// and `color` silently becomes a top-level frontmatter key the
		// component never sees. Catch it on the file with a clear hint.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
attributes:
  data:
    type: query
color: string
size:
  type: number
---
body`,
			standaloneFileType: 'component',
			validationContext: {
				metadata: undefined,
				filters: undefined,
				inlineQueries: undefined,
				trees: undefined,
				basePath: 'components/widget'
			},
			customComponents: {
				'components/widget': '---\ntype: component\n---\nbody'
			}
		});
		const misnested = processor.validationErrors.filter(
			(e) => e.error?.id === 'misnested-component-attribute'
		);
		expect(misnested).toHaveLength(2);
		expect(misnested[0]?.error?.message).toContain('color');
		expect(misnested[1]?.error?.message).toContain('size');
	});

	test('component: flags an invalid attribute declaration on the file itself (the `value: total` footgun)', async () => {
		// `value: total` is shorthand for `value: <type>` — "total" is not a
		// type, so the attribute silently dropped and every `$value` ref went
		// undefined, surfacing as a confusing downstream SQL error. Now it
		// errors at the source with a message teaching the longhand default.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
attributes:
  value: total
---

{% big_value data="revenue" value="{{$value}}" /%}`,
			standaloneFileType: 'component',
			validationContext: {
				metadata: undefined,
				filters: undefined,
				inlineQueries: undefined,
				trees: undefined,
				basePath: 'components/kpi_card'
			},
			customComponents: {}
		});
		const attrErrors = processor.validationErrors.filter(
			(e) => e.error?.id === 'invalid-component-attribute'
		);
		expect(attrErrors).toHaveLength(1);
		expect(attrErrors[0]?.error?.message).toContain('"total" is not a valid declaration');
		expect(attrErrors[0]?.error?.message).toContain('default: total');
	});

	test('component: errors when a component uses its own tag (renders one level then truncates)', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
---

Hello {% kpi_card /%}`,
			standaloneFileType: 'component',
			validationContext: {
				metadata: undefined,
				filters: undefined,
				inlineQueries: undefined,
				trees: undefined,
				basePath: 'components/kpi_card'
			},
			customComponents: {
				'components/kpi_card': '---\ntype: component\n---\nHello {% kpi_card /%}'
			}
		});
		const selfRef = processor.validationErrors.filter(
			(e) => e.error?.id === 'self-referencing-component'
		);
		expect(selfRef).toHaveLength(1);
		expect(selfRef[0]?.error?.message).toContain('kpi_card');
	});

	test('component: does NOT flag legit top-level frontmatter (type/description/attributes)', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
description: A widget
attributes:
  data:
    type: query
---
body`,
			standaloneFileType: 'component'
		});
		expect(
			processor.validationErrors.find((e) => e.error?.id === 'misnested-component-attribute')
		).toBeUndefined();
	});

	test('component: does NOT flag a preview: block, even one that looks like an attr decl', async () => {
		// `preview:` is a legit top-level key. Worst case for the heuristic: a
		// fixture for an attribute literally named `type` whose value happens
		// to be a known type string — the preview value object then contains
		// `type: string`, which is exactly the misnested-attr signal shape.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
attributes:
  type:
    type: string
preview:
  type: string
---
body`,
			standaloneFileType: 'component'
		});
		expect(
			processor.validationErrors.find((e) => e.error?.id === 'misnested-component-attribute')
		).toBeUndefined();
	});

	test('component: does NOT flag arbitrary top-level keys that do not look like attrs', async () => {
		// Only strong signals fire the warning — a `note: "remind me to fix x"`
		// at column 0 is plausibly an author comment, not a misnested attr.
		// The check requires the value to be a known type string OR an
		// object with a known `type:` field. Avoids false-positive churn on
		// real top-level variables.
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({
			content: `---
type: component
note: remind me to refactor this
some_metadata:
  owner: alice
attributes:
  data:
    type: query
---
body`,
			standaloneFileType: 'component'
		});
		expect(
			processor.validationErrors.find((e) => e.error?.id === 'misnested-component-attribute')
		).toBeUndefined();
	});

	test('component: variables getter is normal for pages/partials (no augmentation)', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const asPage = new MarkdocProcessor({
			content: `---
type: component
attributes:
  period:
    type: date_range
---
body`,
			standaloneFileType: 'page'
		});
		// As a page, `period` resolves to whatever the parsed frontmatter
		// produces — NOT the body-property shape. We only augment for the
		// component-editing path.
		const vars = asPage.variables as Record<string, unknown>;
		expect(vars.period).toBeUndefined();
	});

	test('a self-referential custom component breaks the cycle instead of stack-blowing', () => {
		const components = {
			'components/loop': `---
type: component
---

{% loop /%}`
		};
		expect(() =>
			process('{% loop /%}', ctx(), undefined, undefined, undefined, undefined, components)
		).not.toThrow();
	});
});

describe('declared `type: query` attributes get call-site tableExists validation', () => {
	// Same contract as a built-in `data=`: a declared query attribute names a
	// table/query, so a value that resolves to nothing must error at the call
	// site — not render a blank component.
	const metadataStub = (tables: string[]) => ({
		loading: false,
		loadFailed: false,
		tables: tables.map((name) => ({ name })),
		getTable: (name: string) => (tables.includes(name) ? { name } : undefined)
	});

	const COMPONENT = {
		'components/kpi_card': `---
type: component
attributes:
    data:
        type: query
        required: true
    label:
        type: string
        default: KPI
---

{% big_value data={{$data}} value="count(*)" title="{{$label}}" /%}`
	};

	test('a non-existent table/query errors with the same id as built-in data=', () => {
		const { validationErrors } = process(
			'{% kpi_card data="no_such_table" /%}',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ctx({ metadata: metadataStub(['demo.daily_orders']) as any }),
			undefined,
			undefined,
			undefined,
			undefined,
			COMPONENT
		);
		const invalid = validationErrors.filter((e) => e.error?.id === 'invalid-table');
		expect(invalid).toHaveLength(1);
		expect(invalid[0].error.message).toContain('no_such_table');
	});

	test('a real table passes; a string attribute is never checked', () => {
		const { validationErrors } = process(
			'{% kpi_card data="demo.daily_orders" label="whatever text" /%}',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ctx({ metadata: metadataStub(['demo.daily_orders']) as any }),
			undefined,
			undefined,
			undefined,
			undefined,
			COMPONENT
		);
		expect(validationErrors.filter((e) => e.error?.id === 'invalid-table')).toEqual([]);
	});

	test('variable values and missing metadata are skipped (no false positives)', () => {
		const withVariable = process(
			'{% kpi_card data="{{selected.value}}" /%}',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ctx({ metadata: metadataStub([]) as any }),
			undefined,
			undefined,
			undefined,
			undefined,
			COMPONENT
		);
		expect(withVariable.validationErrors.filter((e) => e.error?.id === 'invalid-table')).toEqual(
			[]
		);

		const noMetadata = process(
			'{% kpi_card data="anything" /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			COMPONENT
		);
		expect(noMetadata.validationErrors.filter((e) => e.error?.id === 'invalid-table')).toEqual([]);
	});
});

describe('slots: components accept call-site children', () => {
	const NOTE_BOX = {
		'components/note_box': `---
type: component
attributes:
    tone:
        type: string
        default: info
---

Before slot.

{% slot /%}

After slot.`
	};

	test('default slot: children render at the slot position, in order', () => {
		const { tree, validationErrors } = process(
			'{% note_box tone="warn" %}\nInside **content**.\n\n{% big_value data="demo.daily_orders" value="count(*)" /%}\n{% /note_box %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			NOTE_BOX
		);
		expect(validationErrors.filter((e) => e.error?.level === 'error')).toEqual([]);
		const text = treeText(tree);
		const order = ['Before slot.', 'Inside ', 'big_value', 'After slot.'].map((s) =>
			text.indexOf(s)
		);
		expect(order.every((i) => i >= 0)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
		// No placeholder survives to the renderer.
		expect(text).not.toContain('__ev_slot');
	});

	test('self-closing call renders the body with nothing at the slot', () => {
		const { tree, validationErrors } = process(
			'{% note_box /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			NOTE_BOX
		);
		expect(validationErrors.filter((e) => e.error?.level === 'error')).toEqual([]);
		const text = treeText(tree);
		expect(text).toContain('Before slot.');
		expect(text).toContain('After slot.');
		expect(text).not.toContain('__ev_slot');
	});

	test('named slots: fills route to their slots, loose content to the default slot', () => {
		const components = {
			'components/metric_card': `---
type: component
---

{% slot name="figure" /%}

{% slot /%}

{% slot name="detail" %}_no detail_{% /slot %}`
		};
		const { tree, validationErrors } = process(
			`{% metric_card %}
{% fill slot="figure" %}FIGURE-CONTENT{% /fill %}
LOOSE-CONTENT
{% /metric_card %}`,
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(validationErrors.filter((e) => e.error?.level === 'error')).toEqual([]);
		const text = treeText(tree);
		expect(text).toContain('FIGURE-CONTENT');
		expect(text).toContain('LOOSE-CONTENT');
		// Unfilled named slot keeps its fallback.
		expect(text).toContain('no detail');
		// Figure content lands before loose content (slot order in the body).
		expect(text.indexOf('FIGURE-CONTENT')).toBeLessThan(text.indexOf('LOOSE-CONTENT'));
		expect(text).not.toContain('__ev_slot');
	});

	test('children on a slotless component error with the teaching message', () => {
		const components = {
			'components/no_slot': `---
type: component
---

Just text.`
		};
		const { validationErrors } = process(
			'{% no_slot %}orphaned children{% /no_slot %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		const err = validationErrors.find((e) => e.error?.id === 'component-has-no-slot');
		expect(err).toBeDefined();
		expect(err!.error.message).toContain('{% slot /%}');
	});

	test('a fill naming a nonexistent slot errors and lists the real ones', () => {
		const components = {
			'components/two_slots': `---
type: component
---

{% slot name="figure" /%}
{% slot name="detail" /%}`
		};
		const { validationErrors } = process(
			'{% two_slots %}{% fill slot="figrue" %}typo{% /fill %}{% /two_slots %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		const err = validationErrors.find((e) => e.error?.id === 'unknown-slot-name');
		expect(err).toBeDefined();
		expect(err!.error.message).toContain('"figure"');
		expect(err!.error.message).toContain('"detail"');
	});

	test('a slot on a plain page dissolves to its fallback', () => {
		const { tree } = process(
			'{% slot %}FALLBACK{% /slot %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			{}
		);
		const text = treeText(tree);
		expect(text).toContain('FALLBACK');
		expect(text).not.toContain('__ev_slot');
	});

	test('children stay in the CALLER scope: a page query reference is not component-scoped', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/framed': `---
type: component
---

\`\`\`sql inner_q
select 1 as v
\`\`\`

{% big_value data="inner_q" value="v" /%}

{% slot /%}`
		};
		const page = `\`\`\`sql page_q
select 2 as v
\`\`\`

{% framed %}
{% big_value data="page_q" value="v" /%}
{% /framed %}`;
		const { tree } = process(
			page,
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		const text = treeText(tree);
		// The child's reference stays bare (page query); the component's own
		// reference is scoped.
		expect(text).toContain('"data":"page_q"');
		expect(text).toContain('framed:inner_q');
	});
});

describe('component body errors surface at the call site', () => {
	// A page using a broken component must not validate green — the error has
	// to name the component, the message, and the file:line (battle-test
	// finding: agents were stranded staring at a blank region while the page
	// validator said "all good").
	const metadataStub = (tables: Record<string, string[]>) => ({
		loading: false,
		loadFailed: false,
		tables: Object.keys(tables).map((name) => ({ name })),
		getTable: (name: string) =>
			tables[name] ? { name, columns: tables[name].map((c) => ({ name: c })) } : undefined
	});

	const BROKEN = {
		'components/metric_panel': `---
type: component
---

\`\`\`sql panel_data
select amount from demo.daily_orders
\`\`\`

{% big_value data="no_such_table" value="amount" /%}`
	};

	test('a broken body errors on the page that uses it, with file and line', () => {
		const { validationErrors } = process(
			'# My Page\n\n{% metric_panel /%}',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ctx({ metadata: metadataStub({ 'demo.daily_orders': ['amount'] }) as any }),
			undefined,
			undefined,
			undefined,
			undefined,
			BROKEN
		);
		const bodyErrors = validationErrors.filter((e) => e.error?.id === 'component-body-error');
		expect(bodyErrors).toHaveLength(1);
		expect(bodyErrors[0].error.message).toContain('metric_panel:');
		expect(bodyErrors[0].error.message).toContain('no_such_table');
		expect(bodyErrors[0].error.message).toMatch(/components\/metric_panel:\d+/);
		// Anchored to the call site, so the squiggle lands on {% metric_panel %}.
		expect(bodyErrors[0].lines?.[0]).toBe(2);
	});

	test("the component's own scoped queries never false-positive as missing tables", () => {
		const components = {
			'components/healthy': `---
type: component
---

\`\`\`sql own_query
select 1 as v
\`\`\`

{% big_value data="own_query" value="v" /%}`
		};
		const { validationErrors } = process(
			'{% healthy /%}',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ctx({ metadata: metadataStub({}) as any }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(validationErrors.filter((e) => e.error?.id === 'component-body-error')).toEqual([]);
	});

	test('body warnings do NOT propagate to the call site', () => {
		// A fence with a bare SQL-file path is an ERROR (propagates); this test
		// uses a healthy body plus a component-level warning source to confirm
		// only errors cross the boundary. Frontmatter warnings already have
		// their own call-site channel.
		const components = {
			'components/warny': `---
type: component
---

hello world`
		};
		const { validationErrors } = process(
			'{% warny /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(validationErrors.filter((e) => e.error?.id === 'component-body-error')).toEqual([]);
	});

	test('a mutually recursive component pair does not loop', () => {
		const components = {
			'components/ping': `---
type: component
---

{% pong /%}`,
			'components/pong': `---
type: component
---

{% ping /%}`
		};
		const { validationErrors } = process(
			'{% ping /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		// Terminates; whatever errors surface, the process must not hang.
		expect(Array.isArray(validationErrors)).toBe(true);
	});

	test('many errors are capped with a count', () => {
		const components = {
			'components/very_broken': `---
type: component
---

{% big_value data="t1" value="v" /%}
{% big_value data="t2" value="v" /%}
{% big_value data="t3" value="v" /%}
{% big_value data="t4" value="v" /%}
{% big_value data="t5" value="v" /%}`
		};
		const { validationErrors } = process(
			'{% very_broken /%}',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			ctx({ metadata: metadataStub({}) as any }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		const bodyErrors = validationErrors.filter((e) => e.error?.id === 'component-body-error');
		expect(bodyErrors).toHaveLength(4); // 3 + "2 more errors"
		expect(bodyErrors[3].error.message).toContain('2 more errors');
	});
});

describe('component map keys with .md extensions still register their tag', () => {
	// Overlay-merged maps (pending agent creates) can carry `components/x.md`
	// keys; the DB maps are extensionless. Both forms must yield tag `x` —
	// a `.md`-keyed pending component previously registered as `x.md` and the
	// page showed tag-undefined until a full refresh.
	test('a .md-keyed pending create clears tag-undefined', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({ customComponents: {} });
		processor.markdown = '{% stat_card /%}';
		expect(processor.validationErrors?.map((e) => e.error?.id)).toContain('tag-undefined');

		processor.customComponents = {
			'components/stat_card.md': '---\ntype: component\n---\n\nhello'
		};
		expect(processor.validationErrors?.filter((e) => e.error?.id === 'tag-undefined')).toEqual([]);
	});

	test('scoped query names stay consistent regardless of key form', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		process('{% widget /%}', ctx({ inlineQueries }), undefined, undefined, undefined, undefined, {
			'components/widget.md': `---
type: component
---

\`\`\`sql q
select 1 as v
\`\`\`

{% big_value data="q" value="v" /%}`
		});
		expect(inlineQueries.getAllNames()).toEqual(['widget:q']);
	});
});

describe('component standalone editing: interpolation vs autocomplete variables', () => {
	// The user's stress-test component compiled to SQL containing attribute
	// DESCRIPTIONS ("from Source query with columns date, category, and a
	// numeric value") — the SQL console interpolated with the autocomplete
	// getter, whose per-attribute fallback is default ?? description ?? type.
	test('interpolationVariables carries defaults only; no-default attrs stay absent', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const content = `---
type: component
attributes:
  data:
    type: query
    required: true
    description: Source query with columns date, category, and a numeric value
  category:
    type: string
    required: true
    description: Category to focus the KPI and trend on
  value_col:
    type: column
    default: total_sales
---

body`;
		const processor = new MarkdocProcessor({ standaloneFileType: 'component' });
		processor.markdown = content;

		const interp = processor.interpolationVariables;
		// Defaults are real values.
		expect(interp.value_col).toBe('total_sales');
		// No default → absent, so `{{ $data }}` stays a visible token in the
		// compiled SQL instead of becoming description prose.
		expect(interp.data).toBeUndefined();
		expect(interp.category).toBeUndefined();

		// The autocomplete getter keeps its preview fallbacks (unchanged).
		const preview = processor.variables;
		expect(String(preview.data)).toContain('Source query');
	});
});

describe('preview: frontmatter — authoring fixtures for standalone editing', () => {
	const STRESS = `---
type: component
attributes:
  data:
    type: query
    required: true
  category:
    type: string
    required: true
  value_col:
    type: column
    default: total_sales
preview:
  data: demo.daily_orders
  category: Toys
---

\`\`\`sql me_monthly
select month, sum({{ $value_col }}) as v from {{ $data }} where category = '{{ $category }}' group by month
\`\`\``;

	test('preview values resolve in the standalone render; call sites are untouched', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const processor = new MarkdocProcessor({ standaloneFileType: 'component' });
		processor.markdown = STRESS;
		// Standalone SQL gets fixture + default values.
		const interp = processor.interpolationVariables;
		expect(interp.data).toBe('demo.daily_orders');
		expect(interp.category).toBe('Toys');
		expect(interp.value_col).toBe('total_sales');
	});

	test('no preview and no default → the gate refuses execution for a COMPONENT-scoped query', () => {
		// The gate is scoped to custom-component queries (name carries the
		// `<tag>:` marker). A component used on a page always resolves under a
		// scoped name, so the missing-attribute case throws with the fix path.
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('stress:q', "select * from {{ $data }} where category = '{{ $category }}'");
		expect(() => inlineQueries.getInterpolated('stress:q')).toThrow(/not executed/);
		expect(() => inlineQueries.getInterpolated('stress:q')).toThrow(/\$data, \$category/);
		expect(() => inlineQueries.getInterpolated('stress:q')).toThrow(/preview:/);
	});

	test('a plain page/partial query with the same token does NOT throw (pre-gate pass-through)', () => {
		// Partials legitimately carry caller-scoped `{{ $var }}` tokens that
		// need not be in the partial's own frontmatter — the gate must not
		// convert those (or any pre-existing page query) into a hard failure.
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('q', "select * from {{ $data }} where category = '{{ $category }}'");
		expect(inlineQueries.getInterpolated('q')).toContain('{{ $data }}');
	});

	test('resolved SQL passes the gate', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('q', "select * from demo.t where category = 'Toys'");
		expect(inlineQueries.getInterpolated('q')).toContain("category = 'Toys'");
	});

	test('nudge: SQL-consumed attribute with no value warns at the declaration; preview silences it', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const componentCtx = {
			metadata: undefined,
			filters: undefined,
			inlineQueries: undefined,
			trees: undefined,
			basePath: 'components/stress'
		};
		const noFixture = STRESS.replace('preview:\n  data: demo.daily_orders\n  category: Toys\n', '');
		const bare = new MarkdocProcessor({
			standaloneFileType: 'component',
			validationContext: componentCtx,
			customComponents: {}
		});
		bare.markdown = noFixture;
		const nudges = (bare.validationErrors ?? []).filter(
			(e) => e.error?.id === 'component-attribute-needs-preview'
		);
		expect(nudges.map((n) => n.error.message)).toEqual([
			expect.stringContaining('"data"'),
			expect.stringContaining('"category"')
		]);
		// value_col has a default — no nudge for it.
		expect(nudges.some((n) => n.error.message.includes('value_col'))).toBe(false);

		const withFixture = new MarkdocProcessor({
			standaloneFileType: 'component',
			validationContext: componentCtx,
			customComponents: {}
		});
		withFixture.markdown = STRESS;
		expect(
			(withFixture.validationErrors ?? []).filter(
				(e) => e.error?.id === 'component-attribute-needs-preview'
			)
		).toEqual([]);
	});

	test('a preview key with no matching attribute is flagged as a frontmatter error', () => {
		const meta = parseCustomComponentMeta(
			'components/x',
			'---\ntype: component\nattributes:\n  title:\n    type: string\npreview:\n  titel: oops\n---\n\nbody'
		);
		expect(meta.frontmatterErrors.some((m) => m.includes('preview.titel'))).toBe(true);
	});
});

describe('page-filter references inside components: decidable at call sites', () => {
	const PANEL = {
		'components/sales_panel': `---
type: component
---

\`\`\`sql panel_q
select sum(v) as total from demo.t where region = {{ region.selected }}
\`\`\`

{% big_value data="panel_q" value="total" /%}`
	};
	const makeCtx = () => {
		const filters = new Filters({
			url: undefined,
			updateUrl: undefined,
			projectSettings: undefined,
			dialect: undefined
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		return { filters, inlineQueries };
	};

	test('a page WITH the input validates clean', () => {
		const { filters, inlineQueries } = makeCtx();
		const { validationErrors } = process(
			'{% dropdown id="region" /%}\n\n{% sales_panel /%}',
			ctx({ filters, inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			PANEL
		);
		expect(validationErrors.filter((e) => e.error?.id === 'component-filter-not-on-page')).toEqual(
			[]
		);
	});

	test('a page WITHOUT the input errors at the call site with the fixes', () => {
		const { filters, inlineQueries } = makeCtx();
		const { validationErrors } = process(
			'{% sales_panel /%}',
			ctx({ filters, inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			PANEL
		);
		const errs = validationErrors.filter((e) => e.error?.id === 'component-filter-not-on-page');
		expect(errs).toHaveLength(1);
		expect(errs[0].error.message).toContain('region');
		expect(errs[0].error.message).toContain('components/sales_panel');
		expect(errs[0].error.message).toContain('add the input to the page');
	});

	test('chained scoped queries are not misread as missing filters', () => {
		const { filters, inlineQueries } = makeCtx();
		const components = {
			'components/chained_panel': `---
type: component
---

\`\`\`sql base
select 1 as v
\`\`\`

\`\`\`sql rollup
select sum(v) as total from {{ base }}
\`\`\`

{% big_value data="rollup" value="total" /%}`
		};
		const { validationErrors } = process(
			'{% chained_panel /%}',
			ctx({ filters, inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(validationErrors.filter((e) => e.error?.id === 'component-filter-not-on-page')).toEqual(
			[]
		);
	});

	test('standalone component editing suppresses the missing-filter noise', async () => {
		const { MarkdocProcessor } =
			await import('../Renderer/MarkdocProcessor/MarkdocProcessor.svelte');
		const { filters, inlineQueries } = makeCtx();
		const processor = new MarkdocProcessor({
			standaloneFileType: 'component',
			validationContext: {
				metadata: undefined,
				filters,
				inlineQueries,
				trees: undefined,
				basePath: 'components/sales_panel'
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any,
			customComponents: {}
		});
		processor.markdown = PANEL['components/sales_panel'];
		expect(
			(processor.validationErrors ?? []).filter((e) => e.error?.id === 'invalid-filter-variable')
		).toEqual([]);
	});
});

describe('shared-input warning: same component with a fixed input id used twice', () => {
	const SPOTLIGHT = {
		'components/spotlight': `---
type: component
attributes:
    metric:
        type: column
        default: total_sales
---

{% dropdown id="spotlight_category" /%}

\`\`\`sql spot_q
select sum({{ $metric }}) as v from demo.daily_orders
where category = {{ spotlight_category.selected }}
\`\`\`

{% big_value data="spot_q" value="v" /%}`
	};
	const makeCtx = () => {
		const filters = new Filters({
			url: undefined,
			updateUrl: undefined,
			projectSettings: undefined,
			dialect: undefined
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		return ctx({ filters, inlineQueries: new InlineQueries({ filterContexts: [filters] }) });
	};

	test('two instances warn on the second call site with the id and the fix', () => {
		const { validationErrors } = process(
			'{% spotlight /%}\n\n{% spotlight metric="transactions" /%}',
			makeCtx(),
			undefined,
			undefined,
			undefined,
			undefined,
			SPOTLIGHT
		);
		const warnings = validationErrors.filter((e) => e.error?.id === 'shared-component-input');
		expect(warnings).toHaveLength(1);
		expect(warnings[0].error.level).toBe('warning');
		expect(warnings[0].error.message).toContain('spotlight_category');
		expect(warnings[0].error.message).toContain('share ONE filter');
		expect(warnings[0].error.message).toContain('declare the id as an attribute');
		// Anchored to the SECOND call site.
		expect(warnings[0].lines?.[0]).toBe(2);
	});

	test('a single instance does not warn', () => {
		const { validationErrors } = process(
			'{% spotlight /%}',
			makeCtx(),
			undefined,
			undefined,
			undefined,
			undefined,
			SPOTLIGHT
		);
		expect(validationErrors.filter((e) => e.error?.id === 'shared-component-input')).toEqual([]);
	});

	test('an attribute-driven id does not warn (already per-call-site)', () => {
		const components = {
			'components/param_spotlight': `---
type: component
attributes:
    filter_id:
        type: string
        required: true
---

{% dropdown id="{{$filter_id}}" /%}`
		};
		const { validationErrors } = process(
			'{% param_spotlight filter_id="a" /%}\n\n{% param_spotlight filter_id="b" /%}',
			makeCtx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(validationErrors.filter((e) => e.error?.id === 'shared-component-input')).toEqual([]);
	});
});

describe('row + autosized html: layout expectation warning', () => {
	const CARD = (height: string) => ({
		'components/pulse_card': `---
type: component
---

{% html ${height}%}
<div id="c"></div>
<script>evidence.ready();</script>
{% /html %}`
	});

	test('a heightless html component inside a row warns with the fix', () => {
		const { validationErrors } = process(
			'{% row %}\n{% pulse_card /%}\n{% pulse_card /%}\n{% /row %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			CARD('')
		);
		const warnings = validationErrors.filter((e) => e.error?.id === 'row-autosized-html');
		expect(warnings.length).toBeGreaterThanOrEqual(1);
		expect(warnings[0].error.level).toBe('warning');
		expect(warnings[0].error.message).toContain('height=');
		expect(warnings[0].error.message).toContain('STACK');
	});

	test('height= on the html block silences it; outside a row nothing fires', () => {
		const withHeight = process(
			'{% row %}\n{% pulse_card /%}\n{% /row %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			CARD('height=300 ')
		);
		expect(withHeight.validationErrors.filter((e) => e.error?.id === 'row-autosized-html')).toEqual(
			[]
		);

		const noRow = process(
			'{% pulse_card /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			CARD('')
		);
		expect(noRow.validationErrors.filter((e) => e.error?.id === 'row-autosized-html')).toEqual([]);
	});
});

describe('.selected in display text: quoted-value hint', () => {
	test('a heading using .selected warns with the unquoted forms', () => {
		const { validationErrors } = process(
			'{% dropdown id="cat" /%}\n\n## {{ cat.selected }} — sales',
			ctx()
		);
		const hints = validationErrors.filter((e) => e.error?.id === 'quoted-value-in-text');
		expect(hints).toHaveLength(1);
		expect(hints[0].error.message).toContain('{{ cat }}');
		expect(hints[0].error.message).toContain('{{ cat.literal }}');
	});

	test('bare and .literal forms in text, and .selected inside SQL, stay silent', () => {
		const page = `{% dropdown id="cat" /%}

## {{ cat }} and {{ cat.literal }}

\`\`\`sql q
select * from t where c = {{ cat.selected }}
\`\`\``;
		const { validationErrors } = process(page, ctx());
		expect(validationErrors.filter((e) => e.error?.id === 'quoted-value-in-text')).toEqual([]);
	});
});

describe('round-4 blockers: JS-created filters in components + template enum values', () => {
	const makeFCtx = () => {
		const filters = new Filters({
			url: undefined,
			updateUrl: undefined,
			projectSettings: undefined,
			dialect: undefined
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any);
		return {
			filters,
			ctx: ctx({ filters, inlineQueries: new InlineQueries({ filterContexts: [filters] }) })
		};
	};

	test('evidence.filters.create inside a component body pre-registers page-wide', () => {
		const components = {
			'components/xfilter': `---
type: component
---

{% html %}
<div id="x"></div>
<script>
evidence.filters.create("region_sel", null, { column: "region" });
</script>
{% /html %}`
		};
		const { filters, ctx: vctx } = makeFCtx();
		const { validationErrors } = process(
			'{% xfilter /%}\n\n{% bar_chart data="demo.t" x="a" y="sum(b)" filters=["region_sel"] /%}',
			vctx,
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(filters.filterIds).toContain('region_sel');
		expect(validationErrors.filter((e) => e.error?.message?.includes('region_sel'))).toEqual([]);
	});

	test("the docs' warning_box pattern validates: enum attr bound to a template", () => {
		const components = {
			'components/warning_box': `---
type: component
attributes:
    tone:
        type: string
        default: info
        options: [info, success, warning, error]
---

{% callout type="{{$tone}}" %}
{% slot /%}
{% /callout %}`
		};
		const { validationErrors } = process(
			'{% warning_box tone="warning" %}\nhello\n{% /warning_box %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(validationErrors.filter((e) => e.error?.message?.includes('must match one of'))).toEqual(
			[]
		);
	});

	test('enum attr bound to an unquoted $var resolves via placeholder and validates', () => {
		const components = {
			'components/toned_box': `---
type: component
attributes:
    tone:
        type: string
        options: [info, warning]
---

{% callout type=$tone %}
{% slot /%}
{% /callout %}`
		};
		const { validationErrors } = process(
			'{% toned_box tone="warning" %}\nhello\n{% /toned_box %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(validationErrors.filter((e) => e.error?.message?.includes('must match one of'))).toEqual(
			[]
		);
	});

	test('a genuinely wrong literal enum value in the body still fails', () => {
		const components = {
			'components/bad_box': `---
type: component
---

{% callout type="danger" %}
{% slot /%}
{% /callout %}`
		};
		const { validationErrors } = process(
			'{% bad_box %}\nhello\n{% /bad_box %}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(
			validationErrors.filter((e) => e.error?.message?.includes('must match one of')).length
		).toBeGreaterThanOrEqual(1);
	});
});
