import { describe, test, expect } from 'vitest';
import { process, parse, validate } from '../Renderer/MarkdocProcessor/process-markdoc';
import type { ValidationContext } from '../validators/types';
import { InlineQueries } from '../common/inline-queries';
import { Filters } from '../../Filters.svelte';
import { namespacePrefix } from './namespace-component-queries';

/** Scoped inline-query name for a component path + query name (test helper). */
const scoped = (componentPath: string, queryName: string) =>
	`${namespacePrefix(componentPath)}${queryName}`;

const makeFilters = () =>
	new Filters({
		url: undefined,
		updateUrl: undefined,
		projectSettings: undefined,
		dialect: undefined
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any);

const ctx = (over: Partial<ValidationContext> = {}): ValidationContext => ({
	metadata: undefined,
	filters: undefined,
	inlineQueries: undefined,
	trees: undefined,
	...over
});

describe('custom-component inline SQL is encapsulated', () => {
	test('a query defined in a component body does NOT leak onto the page by its bare name', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/my_widget': `---
type: component
---

\`\`\`sql secret_query
select 1 as one
\`\`\`

{% big_value data="secret_query" value="one" /%}`
		};

		process(
			'{% my_widget /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		// Bare name is NOT registered on the page…
		expect(inlineQueries.getAllNames()).not.toContain('secret_query');
		// …it's registered under the component-scoped name instead.
		expect(inlineQueries.getAllNames()).toContain(scoped('components/my_widget', 'secret_query'));
		expect(inlineQueries.getRaw(scoped('components/my_widget', 'secret_query'))).toContain(
			'select 1 as one'
		);
	});

	test("the component's own reference is rewritten to the scoped name", () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/my_widget': `---
type: component
---

\`\`\`sql secret_query
select 1 as one
\`\`\`

{% big_value data="secret_query" value="one" /%}`
		};

		const { tree } = process(
			'{% my_widget /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const json = JSON.stringify(tree);
		// The rendered big_value points at the scoped query, so it still resolves.
		expect(json).toContain(scoped('components/my_widget', 'secret_query'));
	});

	test('two components can each define a query with the same name without colliding', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/widget_a': `---
type: component
---

\`\`\`sql data
select 'a' as v
\`\`\`

{% big_value data="data" value="v" /%}`,
			'components/widget_b': `---
type: component
---

\`\`\`sql data
select 'b' as v
\`\`\`

{% big_value data="data" value="v" /%}`
		};

		process(
			'{% widget_a /%}\n\n{% widget_b /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		expect(inlineQueries.getRaw(scoped('components/widget_a', 'data'))).toContain("'a'");
		expect(inlineQueries.getRaw(scoped('components/widget_b', 'data'))).toContain("'b'");
		// Neither leaks the bare `data` name.
		expect(inlineQueries.getAllNames()).not.toContain('data');
	});

	test('queries are scoped by tag name, so a nested and a flat component do not collide', () => {
		// `components/a/b` (tag `b`) and `components/a_b` (tag `a_b`) are distinct
		// tags, so `b:q` and `a_b:q` keep their same-named `q` queries apart.
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/a/b': `---\ntype: component\n---\n\n\`\`\`sql q\nselect 'from_nested' as v\n\`\`\`\n\n{% big_value data="q" value="v" /%}`,
			'components/a_b': `---\ntype: component\n---\n\n\`\`\`sql q\nselect 'from_flat' as v\n\`\`\`\n\n{% big_value data="q" value="v" /%}`
		};

		process(
			'{% b /%}\n\n{% a_b /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		expect(scoped('components/a/b', 'q')).toBe('b:q');
		expect(scoped('components/a_b', 'q')).toBe('a_b:q');
		expect(inlineQueries.getRaw('b:q')).toContain('from_nested');
		expect(inlineQueries.getRaw('a_b:q')).toContain('from_flat');
	});

	test('a query name that collides with a NON-query attribute value is not corrupted', () => {
		// A query named `month` must NOT rewrite `x="month"` (a column reference,
		// suggestionType 'column') — only true query-ref attributes (data=,
		// suggestionType 'table') get scoped.
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/chart_widget': `---
type: component
---

\`\`\`sql month
select 1 as v, 'jan' as month
\`\`\`

{% bar_chart data="month" x="month" y="v" /%}`
		};

		const { tree } = process(
			'{% chart_widget /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const json = JSON.stringify(tree);
		// data= (the query ref) is scoped…
		expect(json).toContain(scoped('components/chart_widget', 'month'));
		// …but x= (the column) still says "month", not the scoped name.
		expect(json).toMatch(/"x":\s*"month"/);
	});

	test('query-to-query {{ }} chaining is scoped; bare columns/tables that share the name are not', () => {
		// The ONLY way to reference another inline query is an explicit `{{ }}`
		// block. Query `orders`, referenced by a sibling via `{{ orders }}`, gets
		// scoped — while a column `orders` and a table `real_orders` that merely
		// share the spelling are bare words and stay untouched.
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/cw': `---
type: component
---

\`\`\`sql orders
select 1 as id
\`\`\`

\`\`\`sql summary
select id, {{ orders }} as sub, orders as col from real_orders
\`\`\`

{% big_value data="summary" value="col" /%}`
		};

		process(
			'{% cw /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const summary = inlineQueries.getRaw(scoped('components/cw', 'summary')) ?? '';
		// The {{ orders }} reference IS scoped…
		expect(summary).toContain(`{{ ${scoped('components/cw', 'orders')} }}`);
		// …but the bare column and table are left exactly as written.
		expect(summary).toMatch(/orders as col/);
		expect(summary).toMatch(/from real_orders/);
	});

	test('references that are NOT local inline queries are left alone inside {{ }}', () => {
		// A sql-file path and a filter reference share a `{{ }}` block but must not
		// be scoped — only bare local-query names are.
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/cw': `---
type: component
---

\`\`\`sql q
select * from {{ /queries/orders }} where region = {{ region.value }}
\`\`\`

{% big_value data="q" value="v" /%}`
		};

		process(
			'{% cw /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const q = inlineQueries.getRaw(scoped('components/cw', 'q')) ?? '';
		expect(q).toContain('{{ /queries/orders }}'); // sql-file path untouched
		expect(q).toContain('{{ region.value }}'); // filter ref untouched
	});
});

describe('scoped queries are invisible outside their component', () => {
	test('getPublicNames excludes component-scoped names; getAllNames keeps them for execution', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('page_query', 'select 1');
		inlineQueries.set('kpi_card:revenue', 'select 2');

		expect(inlineQueries.getPublicNames()).toContain('page_query');
		expect(inlineQueries.getPublicNames()).not.toContain('kpi_card:revenue');
		// Execution surfaces still resolve the scoped name.
		expect(inlineQueries.getAllNames()).toContain('kpi_card:revenue');
		expect(inlineQueries.getRaw('kpi_card:revenue')).toBe('select 2');
	});

	test('a page referencing a component-scoped query by name fails tableExists validation', () => {
		// The scoped query EXISTS in the store (the component registered it), but
		// it is private — `data="kpi_card:revenue"` typed on a page must error,
		// not resolve. Metadata is stubbed as loaded-and-empty so the validator
		// reaches its does-not-exist branch instead of skipping.
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		inlineQueries.set('kpi_card:revenue', 'select 42 as total');

		const metadataStub = {
			loading: false,
			loadFailed: false,
			getTable: () => undefined,
			tables: []
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;

		const validationContext = ctx({ inlineQueries, metadata: metadataStub });
		const page = '{% big_value data="kpi_card:revenue" value="total" /%}';
		const ast = parse(page, validationContext);
		const errors = validate(ast, validationContext);

		expect(errors.some((e) => e.error?.id === 'invalid-table')).toBe(true);

		// Control: a genuinely public inline query passes under the same context.
		inlineQueries.set('public_q', 'select 1 as total');
		const okAst = parse('{% big_value data="public_q" value="total" /%}', validationContext);
		const okErrors = validate(okAst, validationContext);
		expect(okErrors.some((e) => e.error?.id === 'invalid-table')).toBe(false);
	});

	test('a user-typed query name containing ":" is rejected (reserved scope marker)', () => {
		const page = '```sql kpi_card:revenue\nselect 99 as total\n```';
		const ast = parse(page, ctx());
		const errors = validate(ast, ctx());

		expect(errors.some((e) => e.error?.id === 'reserved-query-name')).toBe(true);
	});

	test('normal fence names do not trip the reserved-name check', () => {
		const page = '```sql my_query\nselect 1 as v\n```';
		const ast = parse(page, ctx());
		const errors = validate(ast, ctx());
		expect(errors.some((e) => e.error?.id === 'reserved-query-name')).toBe(false);
	});
});

describe('scoped queries compile to executable SQL (the string the warehouse receives)', () => {
	const components = {
		'components/kpi_card': `---
type: component
---

\`\`\`sql revenue
select 42000 as total
\`\`\`

{% big_value data="revenue" value="total" /%}`
	};

	test('getInterpolated on a scoped name yields (sql) "quoted:alias" — default (ClickHouse) dialect', () => {
		// Simulates exactly what Query.svelte.ts does at runtime for the chart
		// inside the component: resolve the scoped name the rewrite gave it.
		const inlineQueries = new InlineQueries({ filterContexts: [makeFilters()] });
		process(
			'{% kpi_card /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const sql = inlineQueries.getInterpolated('kpi_card:revenue');
		// The whole subquery + a fully-quoted alias (":" is valid inside a quoted
		// identifier; unquoted it would be a syntax error — hence this pin).
		// The fence body keeps its trailing newline — harmless in SQL.
		expect(sql).toBe('(select 42000 as total\n) "__ev_inline_kpi_card:revenue"');
	});

	test('getInterpolated on a scoped name — BigQuery dialect (backtick quoting)', async () => {
		const { BigQueryDialect } = await import('../../sql-dialect');
		const inlineQueries = new InlineQueries({ filterContexts: [makeFilters()] });
		process(
			'{% kpi_card /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const sql = inlineQueries.getInterpolated('kpi_card:revenue', new BigQueryDialect());
		expect(sql).toBe('(select 42000 as total\n) `__ev_inline_kpi_card:revenue`');
	});

	test('{{ }} chaining resolves end-to-end: outer scoped query inlines the inner one', () => {
		// The runtime path: interpolateQueryStrings expands {{ chained:base }}
		// into the inner query's SQL. If the scoped token were unresolvable this
		// would throw / leave {{ }} behind.
		const inlineQueries = new InlineQueries({ filterContexts: [makeFilters()] });
		const chained = {
			'components/chained': `---
type: component
---

\`\`\`sql base
select 10 as x
\`\`\`

\`\`\`sql doubled
select x * 2 as y from {{ base }}
\`\`\`

{% big_value data="doubled" value="y" /%}`
		};
		process(
			'{% chained /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			chained
		);

		const sql = inlineQueries.getInterpolated('chained:doubled') ?? '';
		expect(sql).toContain('select 10 as x'); // inner query inlined
		expect(sql).not.toContain('{{'); // no unresolved templates
	});

	test('a page query and a component query with the same name coexist and resolve independently', () => {
		const inlineQueries = new InlineQueries({ filterContexts: [makeFilters()] });
		const page = `\`\`\`sql revenue
select 1 as page_version
\`\`\`

{% kpi_card /%}

{% big_value data="revenue" value="page_version" /%}`;

		process(page, ctx({ inlineQueries }), undefined, undefined, undefined, undefined, components);

		expect(inlineQueries.getRaw('revenue')).toContain('page_version');
		expect(inlineQueries.getRaw('kpi_card:revenue')).toContain('42000');
	});
});

describe('custom-component inputs register on the page (parity with partials)', () => {
	test('a dropdown defined in a component body registers its filter on the page', () => {
		const filters = makeFilters();
		const components = {
			'components/my_widget': `---
type: component
---

{% dropdown id="region" %}
{% dropdown_option value="north" /%}
{% /dropdown %}`
		};

		parse(
			'{% my_widget /%}',
			ctx({ filters }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		expect(filters.filterIds).toContain('region');
	});

	test('a page reference to the component-defined input validates cleanly (id is in context)', () => {
		const filters = makeFilters();
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		const components = {
			'components/my_widget': `---
type: component
---

{% dropdown id="region" %}
{% dropdown_option value="north" /%}
{% /dropdown %}`
		};

		const validationContext = ctx({ filters, inlineQueries });
		// `.selected` is a valid dropdown property; the reference should validate
		// because `region` is registered into the same filters context.
		const ast = parse(
			'{% my_widget /%}\n\nSelected: {{ region.selected }}',
			validationContext,
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		const errors = validate(
			ast,
			validationContext,
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		// The display-text hint (quoted-value-in-text) legitimately fires on
		// `.selected` in a heading — this test asserts the FILTER resolves, so
		// exclude that unrelated teaching warning.
		const regionErrors = errors.filter(
			(e) =>
				e.error?.id !== 'quoted-value-in-text' &&
				String(e.error?.message ?? '')
					.toLowerCase()
					.includes('region')
		);
		expect(regionErrors).toEqual([]);
	});

	test('a component nested inside another component still registers its input (filter bar → dropdown)', () => {
		const filters = makeFilters();
		const components = {
			// leaf: the dropdown component
			'components/region_picker': `---
type: component
---

{% dropdown id="region" %}
{% dropdown_option value="north" /%}
{% /dropdown %}`,
			// parent: a filter bar composed of the dropdown component. NB: not
			// named `filter_bar` — that's a built-in tag, so a custom component
			// using that name is (correctly) dropped from the registry.
			'components/my_filter_bar': `---
type: component
---

{% region_picker /%}`
		};

		parse(
			'{% my_filter_bar /%}',
			ctx({ filters }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		// The input registers even though it's two levels deep (page →
		// my_filter_bar → region_picker → dropdown), matching how nested partials
		// register.
		expect(filters.filterIds).toContain('region');
	});

	test('a self-referencing component body does not loop forever', () => {
		const filters = makeFilters();
		const components = {
			'components/recursive': `---
type: component
---

{% dropdown id="region" %}
{% dropdown_option value="north" /%}
{% /dropdown %}

{% recursive /%}`
		};

		// Should terminate (cycle guard) and still register the input.
		parse(
			'{% recursive /%}',
			ctx({ filters }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(filters.filterIds).toContain('region');
	});
});

describe('evidence.query() calls in {% html %} bodies are scoped (source-level rewrite)', () => {
	// The html tag's body reaches the sandbox as a slice of raw SOURCE text, so
	// the AST rename can't touch it — a dedicated source pre-pass rewrites
	// `evidence.query("<local>")` literals before parsing. These tests read the
	// rendered html attribute (the exact string the sandbox receives).
	const findHtmlAttrs = (tree: unknown): string[] => {
		const out: string[] = [];
		const visit = (n: unknown): void => {
			if (!n || typeof n !== 'object') return;
			const tag = n as { name?: string; attributes?: { html?: string }; children?: unknown[] };
			if (tag.name === 'html' && typeof tag.attributes?.html === 'string') {
				out.push(tag.attributes.html);
			}
			for (const c of tag.children ?? []) visit(c);
		};
		visit(tree);
		return out;
	};

	const component = (body: string) => `---
type: component
---

${body}`;

	test('a local query referenced from an html body resolves to the scoped name', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/health_wealth': component(`\`\`\`sql hw_nations
select 1 as v
\`\`\`

{% html %}
<div id="chart"></div>
<script>
const rows = await evidence.query("hw_nations");
</script>
{% /html %}`)
		};

		const { tree } = process(
			'{% health_wealth /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const [html] = findHtmlAttrs(tree);
		const scopedName = scoped('components/health_wealth', 'hw_nations');
		// The sandbox looks the name up in the page-wide store, where the query
		// only exists under its scoped name — the call must carry that name.
		expect(html).toContain(`evidence.query("${scopedName}")`);
		expect(html).not.toContain('evidence.query("hw_nations")');
		expect(inlineQueries.getAllNames()).toContain(scopedName);
	});

	test('single-quoted and backtick-quoted calls are rewritten; other quoting is preserved', () => {
		const components = {
			'components/quotes': component(`\`\`\`sql q
select 1 as v
\`\`\`

{% html %}
<script>
const a = await evidence.query('q');
const b = await evidence.query(\`q\`);
</script>
{% /html %}`)
		};

		const { tree } = process(
			'{% quotes /%}',
			ctx({ inlineQueries: new InlineQueries({ filterContexts: undefined }) }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const [html] = findHtmlAttrs(tree);
		const scopedName = scoped('components/quotes', 'q');
		expect(html).toContain(`evidence.query('${scopedName}')`);
		expect(html).toContain(`evidence.query(\`${scopedName}\`)`);
	});

	test('names that are not local queries are left alone (page queries, dynamic names)', () => {
		const components = {
			'components/mixed': component(`\`\`\`sql local_q
select 1 as v
\`\`\`

{% html %}
<script>
const a = await evidence.query("local_q");
const b = await evidence.query("page_query");
const c = await evidence.query(someVariable);
</script>
{% /html %}`)
		};

		const { tree } = process(
			'{% mixed /%}',
			ctx({ inlineQueries: new InlineQueries({ filterContexts: undefined }) }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const [html] = findHtmlAttrs(tree);
		expect(html).toContain(`evidence.query("${scoped('components/mixed', 'local_q')}")`);
		expect(html).toContain('evidence.query("page_query")');
		expect(html).toContain('evidence.query(someVariable)');
	});

	test('an html block on the PAGE is never rewritten, even when a component defines the same name', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const components = {
			'components/widget': component(`\`\`\`sql shared_name
select 1 as v
\`\`\`

{% big_value data="shared_name" value="v" /%}`)
		};

		const page = `\`\`\`sql shared_name
select 2 as v
\`\`\`

{% widget /%}

{% html %}
<script>
const rows = await evidence.query("shared_name");
</script>
{% /html %}`;

		const { tree } = process(
			page,
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		// The page's own html block keeps the bare name (it refers to the PAGE query).
		const [html] = findHtmlAttrs(tree);
		expect(html).toContain('evidence.query("shared_name")');
		expect(html).not.toContain(scoped('components/widget', 'shared_name'));
	});

	test('the rewrite preserves line structure, so the html slice stays byte-faithful elsewhere', () => {
		// The nested-template escapes from the battle-test repro (`<\\/script>`)
		// must survive the source-level rewrite untouched.
		const components = {
			'components/modal_widget': component(`\`\`\`sql hw
select 1 as v
\`\`\`

{% html %}
<script>
const rows = await evidence.query("hw");
const tpl = '<div>inner<' + '/script>' + "</div>";
const escaped = "<\\/script>";
</script>
{% /html %}`)
		};

		const { tree } = process(
			'{% modal_widget /%}',
			ctx({ inlineQueries: new InlineQueries({ filterContexts: undefined }) }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const [html] = findHtmlAttrs(tree);
		expect(html).toContain(`evidence.query("${scoped('components/modal_widget', 'hw')}")`);
		expect(html).toContain(`const tpl = '<div>inner<' + '/script>' + "</div>";`);
		expect(html).toContain(`const escaped = "<\\/script>";`);
	});
});

describe('instance scoping: components whose SQL uses {{ $attr }} get per-instance queries', () => {
	const findByName = (tree: unknown, name: string): Record<string, unknown>[] => {
		const out: Record<string, unknown>[] = [];
		const visit = (n: unknown): void => {
			if (!n || typeof n !== 'object') return;
			if (Array.isArray(n)) {
				for (const c of n) visit(c);
				return;
			}
			const tag = n as {
				name?: string;
				attributes?: Record<string, unknown>;
				children?: unknown[];
			};
			if (tag.name === name && tag.attributes) out.push(tag.attributes);
			for (const c of tag.children ?? []) visit(c);
		};
		visit(tree);
		return out;
	};

	const CATEGORY_COMPONENT = `---
type: component
attributes:
  category:
    type: string
    required: true
    default: Home
---

\`\`\`sql test
select sum(total_sales) as t from demo.daily_orders
where category = '{{$category}}'
\`\`\`

{% big_value data="test" value="t" title="{{$category}}" /%}`;

	test('two instances with different attribute values register two queries with the right SQL', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const { tree } = process(
			'{% custom_big_value category="Toys" /%}\n\n{% custom_big_value category="Games" /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			{ 'components/custom_big_value': CATEGORY_COMPONENT }
		);

		const names = inlineQueries.getAllNames();
		expect(names).toHaveLength(2);
		// Each instance's consumer points at its own query, and each query holds
		// that instance's substituted SQL — the exact battle-test failure was one
		// name shared by both, last write winning.
		const bigvals = findByName(tree, 'big_value');
		expect(bigvals).toHaveLength(2);
		const [toys, games] = bigvals;
		expect(toys.data).not.toBe(games.data);
		expect(inlineQueries.getRaw(toys.data as string)).toContain("category = 'Toys'");
		expect(inlineQueries.getRaw(games.data as string)).toContain("category = 'Games'");
	});

	test('two instances with IDENTICAL attribute values share one query', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const { tree } = process(
			'{% custom_big_value category="Toys" /%}\n\n{% custom_big_value category="Toys" /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			{ 'components/custom_big_value': CATEGORY_COMPONENT }
		);

		expect(inlineQueries.getAllNames()).toHaveLength(1);
		const bigvals = findByName(tree, 'big_value');
		expect(bigvals[0].data).toBe(bigvals[1].data);
	});

	test('an omitted attribute (default applies) and an explicit different value get separate queries', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		process(
			'{% custom_big_value /%}\n\n{% custom_big_value category="Games" /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			{ 'components/custom_big_value': CATEGORY_COMPONENT }
		);

		const names = inlineQueries.getAllNames();
		expect(names).toHaveLength(2);
		const raws = names.map((n) => inlineQueries.getRaw(n));
		expect(raws.some((r) => r?.includes("category = 'Home'"))).toBe(true);
		expect(raws.some((r) => r?.includes("category = 'Games'"))).toBe(true);
	});

	test('components whose SQL does NOT use $vars keep the clean definition-scoped name', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		process(
			'{% static_widget /%}\n\n{% static_widget /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			{
				'components/static_widget': `---
type: component
---

\`\`\`sql totals
select 1 as v
\`\`\`

{% big_value data="totals" value="v" /%}`
			}
		);

		expect(inlineQueries.getAllNames()).toEqual([scoped('components/static_widget', 'totals')]);
	});

	test('query chaining and html evidence.query() calls follow the instance-scoped name', () => {
		const inlineQueries = new InlineQueries({ filterContexts: undefined });
		const { tree } = process(
			'{% chained category="Toys" /%}\n\n{% chained category="Games" /%}',
			ctx({ inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			{
				'components/chained': `---
type: component
attributes:
  category:
    type: string
    default: Home
---

\`\`\`sql base
select * from demo.daily_orders where category = '{{$category}}'
\`\`\`

\`\`\`sql rollup
select sum(total_sales) as t from {{ base }}
\`\`\`

{% html %}
<script>
const rows = await evidence.query("rollup");
</script>
{% /html %}`
			}
		);

		const names = inlineQueries.getAllNames();
		expect(names).toHaveLength(4);

		const htmls = findByName(tree, 'html').map((a) => a.html as string);
		expect(htmls).toHaveLength(2);
		// Each html block calls ITS instance's rollup, and that rollup chains to
		// the same instance's base query.
		for (const html of htmls) {
			const match = html.match(/evidence\.query\("(chained@[0-9a-f]+:rollup)"\)/);
			expect(match).not.toBeNull();
			const rollupName = match![1];
			expect(names).toContain(rollupName);
			const instancePrefix = rollupName.slice(0, rollupName.indexOf(':') + 1);
			expect(inlineQueries.getRaw(rollupName)).toContain(`{{ ${instancePrefix}base }}`);
		}
		expect(htmls[0]).not.toBe(htmls[1]);
	});
});

describe('call-site stamping for cmd+click-to-source', () => {
	// Inlined nodes keep their own file's parse coordinates (needed for error
	// attribution and html slicing), so the preview's click-to-source jump
	// reads the stamped call-site position instead — otherwise clicking a
	// component's rendered output scrolls the page editor to the COMPONENT
	// file's line numbers.
	type Stamped = { callSiteLines?: number[]; callSiteFile?: string };
	const findStamped = (tree: unknown, name: string): Stamped[] => {
		const out: Stamped[] = [];
		const visit = (n: unknown): void => {
			if (!n || typeof n !== 'object') return;
			if (Array.isArray(n)) return n.forEach(visit);
			const tag = n as {
				name?: string;
				attributes?: Record<string, unknown>;
				children?: unknown[];
			};
			if (tag.name === name) {
				out.push({
					callSiteLines: tag.attributes?.__evCallSiteLines as number[] | undefined,
					callSiteFile: tag.attributes?.__evCallSiteFile as string | undefined
				});
			}
			(tag.children ?? []).forEach(visit);
		};
		visit(tree);
		return out;
	};

	const WIDGET = {
		'components/my_widget': `---
type: component
---

{% big_value data="demo.daily_orders" value="count(*)" /%}`
	};

	test('component output carries the call-site lines in page coordinates', () => {
		const page = `# Heading

{% my_widget /%}`;
		const { tree } = process(page, ctx(), undefined, undefined, undefined, undefined, WIDGET);

		const [bigValue] = findStamped(tree, 'big_value');
		expect(bigValue).toBeDefined();
		// The {% my_widget /%} call sits on line 2 (0-based) of the page.
		expect(bigValue.callSiteLines?.[0]).toBe(2);
		// Call site is in the page itself — no file.
		expect(bigValue.callSiteFile).toBeUndefined();
	});

	test('nested component output converges on the OUTERMOST call site', () => {
		const components = {
			'components/inner_widget': `---
type: component
---

{% big_value data="demo.daily_orders" value="count(*)" /%}`,
			'components/outer_widget': `---
type: component
---

{% inner_widget /%}`
		};
		const { tree } = process(
			'{% outer_widget /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);

		const [bigValue] = findStamped(tree, 'big_value');
		expect(bigValue).toBeDefined();
		// Outer transform runs last and re-stamps: page coordinates win.
		expect(bigValue.callSiteLines?.[0]).toBe(0);
		expect(bigValue.callSiteFile).toBeUndefined();
	});

	test('page-own nodes are not stamped', () => {
		const { tree } = process(
			'{% big_value data="demo.daily_orders" value="count(*)" /%}',
			ctx(),
			undefined,
			undefined,
			undefined,
			undefined,
			{}
		);
		const [bigValue] = findStamped(tree, 'big_value');
		expect(bigValue.callSiteLines).toBeUndefined();
	});
});

describe('documented contract: page references a component-declared input', () => {
	// The docs promise: an input declared in a component body "registers
	// page-wide under its id" and the page can reference it. A battle-test
	// agent hit author-time validation errors on exactly this pattern (via a
	// stale deploy) — this locks the contract at the validation layer.
	test('filters= and where= references to a component-declared dropdown validate clean', () => {
		const filters = makeFilters();
		const inlineQueries = new InlineQueries({ filterContexts: [filters] });
		const components = {
			'components/filter_panel': `---
type: component
---

{% dropdown id="region" /%}`
		};
		const page = `\`\`\`sql sales
select region, sum(total) as total from demo.daily_orders
where region = {{ region.selected }}
group by region
\`\`\`

{% filter_panel /%}

{% big_value data="sales" value="sum(total)" /%}`;

		const { validationErrors } = process(
			page,
			ctx({ filters, inlineQueries }),
			undefined,
			undefined,
			undefined,
			undefined,
			components
		);
		expect(filters.filterIds).toContain('region');
		const filterErrors = validationErrors.filter(
			(e) =>
				e.error?.message?.includes('region') &&
				(e.error?.id === 'invalid-filter-variable' || e.error?.message?.includes('does not exist'))
		);
		expect(filterErrors).toEqual([]);
	});
});
