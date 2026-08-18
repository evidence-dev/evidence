import { describe, it, expect } from 'vitest';
import { transformPage, convertInputRefs, type MigrationNote } from './transform.ts';

describe('transformPage', () => {
	it('converts a self-closing chart with bare and expression attrs', () => {
		const { content } = transformPage(`<LineChart data={daily_orders} x=date y=sales />`);
		expect(content).toBe(
			`{% line_chart data="daily_orders" x="date" y="sales" handle_missing="gaps" /%}`
		);
	});

	it('converts multi-line components and keeps boolean/number literals', () => {
		const source = `<BarChart
  data={projects}
  title="GitHub Stars by Project"
  x=name
  y=stars
  yAxisLabels=false
  yGridlines=false
  labels=true
/>`;
		const { content } = transformPage(source);
		expect(content).toContain('{% bar_chart');
		expect(content).toContain('data="projects"');
		expect(content).toContain('y_axis_options={labels=false gridlines=false}');
		expect(content).toContain('data_labels={position="above"}');
		expect(content).toContain('/%}');
	});

	it('maps BarChart swapXY to horizontal_bar_chart with swapped axes', () => {
		const { content } = transformPage(
			`<BarChart data={q} x=name y=stars swapXY yAxisLabels=false />`
		);
		expect(content).toContain('{% horizontal_bar_chart');
		expect(content).toContain('x="stars"');
		expect(content).toContain('y="name"');
		expect(content).toContain('x_axis_options={labels=false}');
		expect(content).not.toContain('swap');
	});

	it('closes a non-self-closing swapXY BarChart with horizontal_bar_chart', () => {
		const { content } = transformPage(
			`<BarChart data={q} x=name y=stars swapXY>\n  <ReferenceLine y=10 />\n</BarChart>`
		);
		expect(content).toContain('{% horizontal_bar_chart');
		expect(content).toContain('{% /horizontal_bar_chart %}');
		expect(content).not.toContain('{% /bar_chart %}');
	});

	it('closes a plain BarChart with bar_chart', () => {
		const { content } = transformPage(
			`<BarChart data={q} x=name y=stars>\n  <ReferenceLine y=10 />\n</BarChart>`
		);
		expect(content).toContain('{% /bar_chart %}');
		expect(content).not.toContain('horizontal_bar_chart');
	});

	it('matches nested same-name tags to their own opening tag', () => {
		const { content } = transformPage(
			`<BarChart data={a} x=n y=s swapXY>\n<BarChart data={b} x=n y=s>\n</BarChart>\n</BarChart>`
		);
		// Inner plain chart closes first, outer horizontal one last.
		expect(content.indexOf('{% /bar_chart %}')).toBeLessThan(
			content.indexOf('{% /horizontal_bar_chart %}')
		);
	});

	it('drops attrs not in the studio schema when tagAttrs provided', () => {
		const tagAttrs = new Map([['line_chart', new Set(['data', 'x', 'y'])]]);
		const { content, notes } = transformPage(`<LineChart data={q} x=a y=b sort=false />`, {
			tagAttrs
		});
		expect(content).toBe(`{% line_chart data="q" x="a" y="b" /%}`);
		expect(notes.some((n) => n.message.includes('dropped attribute'))).toBe(true);
	});

	it('converts DataTable/Column to table/dimension with link handling', () => {
		const source = `<DataTable data={projects} link=url>
  <Column id=name/>
  <Column id=source_code contentType=link linkLabel="GitHub &rarr;"/>
</DataTable>`;
		const { content } = transformPage(source);
		expect(content).toContain('{% table data="projects" link="url" %}');
		expect(content).toContain('{% dimension value="name" /%}');
		expect(content).toContain(
			'{% dimension value="source_code" link_label="GitHub →" link="source_code" /%}'
		);
		expect(content).toContain('{% /table %}');
	});

	it('converts img tags to image components', () => {
		const { content, notes } = transformPage(
			`<img src="https://example.com/a.png" alt="Archie" class="rounded-full w-24">`
		);
		expect(content).toBe(
			`{% image url="https://example.com/a.png" description="Archie" class="rounded-full w-24" /%}`
		);
		expect(notes.some((n) => n.message.includes('image'))).toBe(true);
	});

	it('converts link/image-only html blocks to markdown (sandbox CSP would block them)', () => {
		const source = `text before

<div style="display: flex;">
    <a href="https://x.com"><img src="https://img.shields.io/badge.svg" alt="X"></a>
    <a href="https://github.com/a"><img src="https://img.shields.io/gh.svg" alt="GitHub"></a>
</div>

text after`;
		const { content, notes } = transformPage(source);
		expect(content).toContain(
			'[![X](https://img.shields.io/badge.svg)](https://x.com) [![GitHub](https://img.shields.io/gh.svg)](https://github.com/a)'
		);
		expect(content).not.toContain('{% html %}');
		expect(notes.some((n) => n.message.includes('converted to markdown'))).toBe(true);
	});

	it('converts bare links and images inside simple blocks', () => {
		const { content } = transformPage(
			`<p><a href="https://a.com">Site</a> <img src="https://a.com/i.png" alt="i"></p>`
		);
		expect(content).toBe('[Site](https://a.com) ![i](https://a.com/i.png)');
	});

	it('wraps complex html blocks in {% html %} with a CSP warning', () => {
		const source = `<div class="grid">
    <button onclick="go()">Click</button>
</div>`;
		const { content, notes } = transformPage(source);
		expect(content).toContain('{% html %}\n<div class="grid">');
		expect(content).toContain('</div>\n{% /html %}');
		expect(notes.some((n) => n.level === 'warning' && n.message.includes('sandbox CSP'))).toBe(
			true
		);
	});

	it('converts DocTab to tabs with Preview and Code tabs', () => {
		const source = `<DocTab>
    <div slot='preview'>
      <BigValue data={orders} value=num_orders />
    </div>

\`\`\`markdown
<BigValue data={orders} value=num_orders />
\`\`\`
</DocTab>`;
		const { content, notes } = transformPage(source);
		expect(content).toContain('{% tabs %}');
		expect(content).toContain('{% tab title="Preview" %}');
		expect(content).toContain('{% tab title="Code" %}');
		expect(content).toContain('{% /tabs %}');
		expect(content).not.toContain('doc_tab');
		expect(content).not.toContain('<div');
		expect(content).toContain('{% big_value data="orders" value="num_orders" /%}');
		// Code fence lives inside the Code tab.
		expect(content).toContain('```markdown');
		expect((content.match(/\{% \/tab %\}/g) ?? []).length).toBe(2);
		expect(notes.some((n) => n.message.includes('DocTab'))).toBe(true);
	});

	it('converts PropListing to a markdown bullet', () => {
		const { content } = transformPage(
			`<PropListing name="data" description="Query name" required=true options="query name" />`
		);
		expect(content).toBe('- **data** (required) — Query name Options: query name.');
	});

	it('converts OSS component examples inside markdown fences', () => {
		const source = '```markdown\n<BigValue data={orders} value=num_orders />\n```';
		const { content } = transformPage(source);
		expect(content).toBe('```markdown\n{% big_value data="orders" value="num_orders" /%}\n```');
	});

	it('strips wrappers spanning blank lines around markdown content', () => {
		const source = `<Grid cols=2>
<div>

### Data person

- Spec
- Docs

</div>
</Grid>`;
		const { content, notes } = transformPage(source);
		expect(content).not.toContain('{% html %}');
		expect(content).not.toContain('<div');
		expect(content).toContain('### Data person');
		expect(content).toContain('- Spec');
		expect(notes.some((n) => n.message.includes('wrapper around'))).toBe(true);
	});

	it('rewrites data attrs referencing frontmatter query files', () => {
		const source = `---
title: Big Value
hide_title: true
queries:
- orders_with_comparisons.sql
---

<BigValue data={orders_with_comparisons} value=num_orders />`;
		const { content } = transformPage(source);
		expect(content).toContain('data="/queries/orders_with_comparisons"');
	});

	it('is idempotent for existing {% html %} blocks', () => {
		const source = `{% html %}
<div style="x">
    <a href="https://x.com"><img src="https://a.png"></a>
</div>
{% /html %}
`;
		const result = transformPage(source);
		expect(result.changed).toBe(false);
		expect(result.content).toBe(source);
	});

	it('converts paired components with content', () => {
		const source = `<Tabs>
  <Tab label="Sales">Content</Tab>
</Tabs>`;
		const { content } = transformPage(source);
		expect(content).toBe(`{% tabs %}
  {% tab title="Sales" %}Content{% /tab %}
{% /tabs %}`);
	});

	it('converts array literal attrs to markdoc arrays', () => {
		const { content, notes } = transformPage(`<BarChart data={q} x=a y={['m', 'n']} />`);
		expect(content).toContain('y=["m", "n"]');
		expect(notes.some((n) => n.message.includes('expression'))).toBe(false);
	});

	it('maps OSS chart type and nullsZero onto stacked/handle_missing', () => {
		const { content } = transformPage(`<BarChart data={q} x=a y=b type=grouped nullsZero=true />`);
		expect(content).toContain('stacked=false');
		expect(content).toContain('handle_missing="zero"');
		expect(content).not.toContain('type=');
	});

	it('emits OSS missing-data defaults on line/area charts', () => {
		// Multi-series areas zero-fill unconditionally in OSS.
		expect(transformPage(`<AreaChart data={q} x=week y=users series=cohort />`).content).toContain(
			'handle_missing="zero"'
		);
		expect(transformPage(`<AreaChart data={q} x=week y={['a', 'b']} />`).content).toContain(
			'handle_missing="zero"'
		);
		// Single-series area and all lines default to gaps in OSS (never connect).
		expect(transformPage(`<AreaChart data={q} x=week y=users />`).content).toContain(
			'handle_missing="gaps"'
		);
		expect(transformPage(`<LineChart data={q} x=week y=users series=cohort />`).content).toContain(
			'handle_missing="gaps"'
		);
	});

	it('maps explicit handleMissing values and respects nullsZero', () => {
		expect(transformPage(`<LineChart data={q} x=a y=b handleMissing=gap />`).content).toContain(
			'handle_missing="gaps"'
		);
		expect(transformPage(`<LineChart data={q} x=a y=b handleMissing=connect />`).content).toContain(
			'handle_missing="connect"'
		);
		const zeroed = transformPage(`<AreaChart data={q} x=a y=b nullsZero=true />`).content;
		expect(zeroed.match(/handle_missing/g)).toHaveLength(1);
		expect(zeroed).toContain('handle_missing="zero"');
	});

	it('maps Alert statuses onto valid callout types', () => {
		expect(transformPage(`<Alert status=info>x</Alert>`).content).toContain(
			'{% callout type="info" %}'
		);
		expect(transformPage(`<Alert status=negative>x</Alert>`).content).toContain(
			'{% callout type="error" %}'
		);
		expect(transformPage(`<Alert status=positive>x</Alert>`).content).toContain(
			'{% callout type="success" %}'
		);
		// default/none/unknown statuses fall back to studio's default (no type attr).
		expect(transformPage(`<Alert status=none>x</Alert>`).content).toContain('{% callout %}');
		expect(transformPage(`<Alert>x</Alert>`).content).toContain('{% callout %}');
	});

	it('converts OSS Callout (chart annotation) to reference_point with a note', () => {
		const { content, notes } = transformPage(
			`<Callout x="2021-05-01" y=11012 labelPosition=bottom>text</Callout>`
		);
		expect(content).toContain('{% reference_point');
		expect(content).toContain('{% /reference_point %}');
		expect(notes.some((n) => n.message.includes('annotation'))).toBe(true);
	});

	it('converts DateRange to range_calendar', () => {
		const { content } = transformPage(
			`<DateRange name=range data={orders} dates=order_date defaultValue="Last 7 Days" />`
		);
		expect(content).toBe(
			`{% range_calendar id="range" data="orders" value_column="order_date" default_range="Last 7 Days" /%}`
		);
	});

	it('drops colorscale Column attrs with a conditional_colors pointer', () => {
		const { content, notes } = transformPage(
			`<Column id=delta contentType=colorscale scaleColor={['maroon','white','green']} colorMin=-1 colorMax=1 />`
		);
		expect(content).toBe(`{% dimension value="delta" /%}`);
		expect(notes.some((n) => n.message.includes('conditional_colors'))).toBe(true);
	});

	it('renames Dropdown input attrs', () => {
		const { content } = transformPage(`<Dropdown name=category data={orders} value=category />`);
		expect(content).toBe(`{% dropdown id="category" data="orders" value_column="category" /%}`);
	});

	it('leaves frontmatter and non-sql fences untouched, converts input refs in sql fences', () => {
		const source = `---
title: My Page
---

\`\`\`sql filtered
select * from orders where category = '\${inputs.category.value}'
\`\`\`

\`\`\`python
x = "\${inputs.category.value}"
\`\`\`
`;
		const { content } = transformPage(source);
		expect(content).toContain('title: My Page');
		expect(content).toContain(`where category = {{category}}`);
		expect(content).toContain(`x = "\${inputs.category.value}"`);
	});

	it('inserts the frontmatter title as an h1 when OSS would have rendered one', () => {
		const source = `---
title: Sales
---

Some content.
`;
		const { content } = transformPage(source);
		expect(content).toBe(`---
title: Sales
---

# Sales

Some content.
`);
	});

	it('does not insert an h1 when hide_title is true or one already exists', () => {
		const hidden = transformPage(`---\ntitle: Sales\nhide_title: true\n---\n\nContent.\n`);
		expect(hidden.content).not.toContain('# Sales');
		const existing = transformPage(`---\ntitle: Sales\n---\n\n# Sales\n\nContent.\n`);
		expect(existing.changed).toBe(false);
	});

	it('warns on unknown components', () => {
		const { notes } = transformPage(`<BoxPlot data={q} />`);
		expect(notes.some((n) => n.level === 'warning' && n.message.includes('BoxPlot'))).toBe(true);
	});

	it('reports changed=false for plain markdown', () => {
		const source = `# Title\n\nSome regular markdown with **bold**.\n`;
		const result = transformPage(source);
		expect(result.changed).toBe(false);
		expect(result.content).toBe(source);
	});
});

describe('convertInputRefs', () => {
	it('handles quoted, unquoted and no-.value forms', () => {
		const notes: never[] = [];
		expect(convertInputRefs(`where a = '\${inputs.x.value}'`, notes)).toBe('where a = {{x}}');
		expect(convertInputRefs(`where a = \${inputs.x}`, notes)).toBe('where a = {{x}}');
	});

	it('maps frontmatter-declared query files to /queries paths', () => {
		const source = `---
title: Funnel
queries:
  - funnel_by_split: funnel_by_split.sql
---

\`\`\`sql funnel
Select * from \${funnel_by_split}
\`\`\`
`;
		const { content } = transformPage(source);
		expect(content).toContain('Select * from {{ /queries/funnel_by_split }}');
	});

	it('folds BigValue sparkline column and type into the object form', () => {
		const { content } = transformPage(
			`<BigValue data={WAU} value=users sparkline=week sparklineType=bar />`
		);
		expect(content).toContain('sparkline={x="week" type="bar"}');
	});

	it('converts params and query references', () => {
		const notes: MigrationNote[] = [];
		expect(convertInputRefs(`where u = '\${params.user}'`, notes)).toBe('where u = {{user}}');
		expect(convertInputRefs(`from \${funnel_by_split}`, notes)).toBe('from {{funnel_by_split}}');
		expect(notes.some((n) => n.level === 'warning' && n.message.includes('templated'))).toBe(true);
	});

	it('preserves input property paths like .start/.end', () => {
		const notes: never[] = [];
		expect(
			convertInputRefs(`between '\${inputs.dateR.start}' and '\${inputs.dateR.end}'`, notes)
		).toBe('between {{dateR.start}} and {{dateR.end}}');
	});

	it('warns that a project .sql file will not interpolate the converted refs', () => {
		const notes: MigrationNote[] = [];
		expect(convertInputRefs(`where a = '\${inputs.x.value}'`, notes, new Map(), 'sql-file')).toBe(
			'where a = {{x}}'
		);
		expect(
			notes.some((n) => n.level === 'warning' && n.message.includes('inlines project .sql files'))
		).toBe(true);
		// Same rewrite in a page is routine, not a warning.
		const pageNotes: MigrationNote[] = [];
		convertInputRefs(`where a = '\${inputs.x.value}'`, pageNotes);
		expect(pageNotes.every((n) => n.level === 'info')).toBe(true);
	});

	it('warns once per .sql file however many refs it holds', () => {
		const notes: MigrationNote[] = [];
		convertInputRefs(
			`where a = \${inputs.x} and b = \${inputs.y} and c in (from \${orders})`,
			notes,
			new Map(),
			'sql-file'
		);
		expect(notes.filter((n) => n.message.includes('inlines project .sql files'))).toHaveLength(1);
	});
});
