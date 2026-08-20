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

	it('drops attrs not in the Core schema when tagAttrs provided', () => {
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

	it('converts legacy component examples inside markdown fences', () => {
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

	it('maps legacy chart type and nullsZero onto stacked/handle_missing', () => {
		const { content } = transformPage(`<BarChart data={q} x=a y=b type=grouped nullsZero=true />`);
		expect(content).toContain('stacked=false');
		expect(content).toContain('handle_missing="zero"');
		expect(content).not.toContain('type=');
	});

	it('emits legacy missing-data defaults on line/area charts', () => {
		// Multi-series areas zero-fill unconditionally in legacy.
		expect(transformPage(`<AreaChart data={q} x=week y=users series=cohort />`).content).toContain(
			'handle_missing="zero"'
		);
		expect(transformPage(`<AreaChart data={q} x=week y={['a', 'b']} />`).content).toContain(
			'handle_missing="zero"'
		);
		// Single-series area and all lines default to gaps in legacy (never connect).
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
		// default/none/unknown statuses fall back to Core's default (no type attr).
		expect(transformPage(`<Alert status=none>x</Alert>`).content).toContain('{% callout %}');
		expect(transformPage(`<Alert>x</Alert>`).content).toContain('{% callout %}');
	});

	it('converts legacy Callout (chart annotation) to reference_point with a note', () => {
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

	it('converts colorscale Columns to measure viz="color" with color_options', () => {
		const { content, notes } = transformPage(
			`<Column id=delta contentType=colorscale scaleColor={['maroon','white','green']} colorMin=-1 colorMax=1 />`
		);
		expect(content).toBe(
			`{% measure value="delta" color_options={color_scale=["maroon", "white", "green"]} viz="color" /%}`
		);
		expect(notes.some((n) => n.message.includes('color_stops'))).toBe(true);
	});

	it('renames Value column to value and warns when both are missing', () => {
		const { content } = transformPage(`<Value data={orders} column=sales fmt=usd2 />`);
		expect(content).toBe(`{% value data="orders" value="sales" fmt="usd2" /%}`);

		const { notes } = transformPage(`<Value data={orders} />`);
		expect(notes.some((n) => n.message.includes('value=<column>'))).toBe(true);
	});

	it('renames LinkButton/BigLink href to url', () => {
		const { content } = transformPage(`<BigLink href='/settings'>Settings</BigLink>`);
		expect(content).toContain('url="/settings"');
		const { content: lb } = transformPage(`<LinkButton href='https://x.io'>Go</LinkButton>`);
		expect(lb).toContain('url="https://x.io"');
	});

	it('warns when a chart omits x or y (legacy inferred them)', () => {
		const { notes } = transformPage(`<LineChart data={q} y=sales />`);
		expect(notes.some((n) => n.message.includes('x='))).toBe(true);

		const { notes: barNotes } = transformPage(`<BarChart data={q} />`);
		expect(barNotes.some((n) => n.message.includes('x= and y='))).toBe(true);

		const { notes: ok } = transformPage(`<LineChart data={q} x=date y=sales />`);
		expect(ok.some((n) => n.message.includes('Core requires'))).toBe(false);
	});

	it('maps a single fillColor/lineColor to chart_options color_palette', () => {
		const { content } = transformPage(`<BarChart data={q} x=a y=b fillColor="maroon" />`);
		expect(content).toContain('chart_options={color_palette=["maroon"]}');

		const { content: both, notes } = transformPage(
			`<AreaChart data={q} x=a y=b fillColor="maroon" lineColor="navy" />`
		);
		expect(both).not.toContain('color_palette');
		expect(notes.some((n) => n.message.includes('one series color'))).toBe(true);
	});

	it('folds axis, line, and data-label props into Core option objects', () => {
		const { content } = transformPage(
			`<LineChart data={q} x=a y=b yScale=true xTickMarks=true y2Min=0 lineWidth=3 lineType=dotted markers=true markerShape=diamond labelFmt=usd labels=true chartAreaHeight=300 seriesColors={{"a":"red"}} />`
		);
		expect(content).toContain('y_axis_options={fit_to_data=true}');
		expect(content).toContain('x_axis_options={ticks=true}');
		expect(content).toContain('y2_axis_options={min=0}');
		expect(content).toContain('line_options={width=3 type="dotted" markers={shape="diamond"}}');
		expect(content).toContain('data_labels={position="above" fmt="usd"}');
		expect(content).toContain('height=300');
		expect(content).toContain('series_colors=');
	});

	it('flags unsupported chart props with an unsupported-in-Core warning', () => {
		const { notes } = transformPage(`<LineChart data={q} x=a y=b yLog=true renderer=svg />`);
		expect(
			notes.some((n) => n.message.includes('unsupported in Core: y_log, renderer'))
		).toBe(true);
	});

	it('suppresses axis folds on histogram (no axis options in Core)', () => {
		const { content, notes } = transformPage(`<Histogram data={q} x=a yMax=10 />`);
		expect(content).not.toContain('axis_options');
		expect(notes.some((n) => n.message.includes('unsupported in Core: y_max'))).toBe(true);
	});

	it('folds ReferenceLine styling and defaults the legacy dashed type', () => {
		const { content } = transformPage(
			`<ReferenceLine y=100 label="Target" labelColor="red" fontSize=14 bold=true lineWidth="2" symbolEnd=circle symbolEndSize=8 />`
		);
		expect(content).toContain('label_options={color="red" text={size=14 bold=true}}');
		expect(content).toContain('line_options={width=2 type="dashed"}');
		expect(content).toContain('symbols={end={shape="circle" size=8}}');
	});

	it('converts ReferenceArea border=true to a dashed 1px border', () => {
		const { content } = transformPage(`<ReferenceArea xMin=1 xMax=2 border=true opacity=0.5 />`);
		expect(content).toContain('area_options={opacity=0.5 border={width=1 type="dashed"}}');
	});

	it('gives converted Callouts the legacy callout label box', () => {
		const { content } = transformPage(`<Callout x=1 y=2 label="hi" symbolColor="red" />`);
		expect(content).toContain('label_options={width=80 variant="callout"}');
		expect(content).toContain('symbol_options={color="red"}');
	});

	it('repositions rich data_labels when swapXY makes the chart horizontal', () => {
		const { content } = transformPage(
			`<BarChart data={q} x=name y=stars swapXY labels=true labelFmt=usd />`
		);
		expect(content).toContain('{% horizontal_bar_chart');
		expect(content).toContain('position="right"');
		expect(content).toContain('fmt="usd"');
		expect(content).not.toContain('position="above"');
	});

	it('maps DataTable grouping onto Core collapsible groups', () => {
		// Accordion: collapsible needs subtotals (they are the group headers),
		// and legacy defaults groups OPEN where Core defaults collapsed.
		const { content, notes } = transformPage(
			`<DataTable data={q} groupBy=category groupType=accordion />`
		);
		expect(content).toContain('collapsible=true');
		expect(content).toContain('collapsed=false');
		expect(content).not.toContain('subtotals=false');
		expect(notes.some((n) => n.message.includes('first {% dimension %}'))).toBe(true);

		// groupsOpen=false matches Core's collapsed default — no attr needed.
		const { content: closed } = transformPage(
			`<DataTable data={q} groupBy=category groupType=accordion groupsOpen=false />`
		);
		expect(closed).toContain('collapsible=true');
		expect(closed).not.toContain('collapsed');

		// Non-collapsible grouping keeps the legacy no-subtotals look.
		const { content: section } = transformPage(
			`<DataTable data={q} groupBy=category groupType=section />`
		);
		expect(section).toContain('subtotals=false');
		expect(section).not.toContain('collapsible');
	});

	it('converts viz Columns to measures with option objects', () => {
		const { content } = transformPage(
			`<Column id=sales contentType=bar barColor="blue" hideLabels=true />`
		);
		expect(content).toBe(
			`{% measure value="sales" bar_options={bar_color="blue" hide_labels=true} viz="bar" /%}`
		);
		const { content: spark } = transformPage(
			`<Column id=trend contentType=sparkarea sparkX=month sparkColor="red" />`
		);
		expect(spark).toContain('viz="sparkline"');
		expect(spark).toContain('sparkline_options={x="month" color="red" type="area"}');
		const { content: html } = transformPage(`<Column id=notes contentType=html />`);
		expect(html).toBe(`{% dimension value="notes" html=true /%}`);
		const { content: img } = transformPage(`<Column id=pic contentType=image height=40 alt="logo" />`);
		expect(img).toContain('image="pic"');
		expect(img).toContain('image_options={height=40 alt="logo" hide_label=true}');
	});

	it('folds Value agg and Delta neutral bounds', () => {
		const { content } = transformPage(`<Value data={q} column=sales agg=sum />`);
		expect(content).toBe(`{% value data="q" value="sum(sales)" /%}`);
		const { content: delta } = transformPage(
			`<Delta data={q} column=growth neutralMin=-0.1 neutralMax=0.1 />`
		);
		expect(delta).toBe(`{% delta data="q" value="growth" neutral_range=[-0.1, 0.1] /%}`);
	});

	it('keeps camelCase attrs that Core schemas declare camel', () => {
		const tagAttrs = new Map([['value', new Set(['data', 'value', 'redNegatives', 'fmt'])]]);
		const { content } = transformPage(`<Value data={q} column=sales redNegatives=true />`, {
			tagAttrs
		});
		expect(content).toContain('redNegatives=true');
	});

	it('maps colorPalette to chart_options and sort=false to x_sort', () => {
		const { content } = transformPage(
			`<LineChart data={q} x=a y=b colorPalette={['red','blue']} sort=false />`
		);
		expect(content).toContain('chart_options={color_palette=["red", "blue"]}');
		expect(content).toContain('x_sort="data"');
		expect(content).not.toContain('sort=false');

		const { content: sorted } = transformPage(`<BarChart data={q} x=a y=b sort=true />`);
		expect(sorted).not.toContain('sort');
	});

	it('folds all flat sparkline props into the sparkline object', () => {
		const { content } = transformPage(
			`<BigValue data={q} value=sales sparkline=month sparklineColor="red" sparklineValueFmt=usd sparklineDateFmt="mmm" sparklineYScale=true connectGroup=kpis />`
		);
		expect(content).toContain(
			'sparkline={x="month" color="red" y_fmt="usd" x_fmt="mmm" fit_to_data=true connect_group="kpis"}'
		);
	});

	it('renames standalone Sparkline props to Core names', () => {
		const { content } = transformPage(
			`<Sparkline data={q} dateCol=month valueCol=sales valueFmt=usd dateFmt="mmm" yScale=true />`
		);
		expect(content).toBe(
			`{% sparkline data="q" x="month" y="sales" y_fmt="usd" x_fmt="mmm" fit_to_data=true /%}`
		);
	});

	it('renames ReferenceArea areaColor to color unless color is set', () => {
		const { content } = transformPage(`<ReferenceArea xMin=1 xMax=2 areaColor="red" />`);
		expect(content).toContain('color="red"');
		const { content: both, notes } = transformPage(
			`<ReferenceArea xMin=1 color="blue" areaColor="red" />`
		);
		expect(both).toContain('color="blue"');
		expect(both).not.toContain('area_color');
		expect(notes.some((n) => n.message.includes('kept color'))).toBe(true);
	});

	it('renames DataTable showLinkCol to show_link_column', () => {
		const { content } = transformPage(`<DataTable data={q} showLinkCol=true />`);
		expect(content).toContain('show_link_column=true');
	});

	it('renames DropdownOption/ButtonGroupItem valueLabel to label', () => {
		const { content } = transformPage(`<DropdownOption value="%" valueLabel="All Categories"/>`);
		expect(content).toBe(`{% dropdown_option value="%" label="All Categories" /%}`);
		const { content: bg } = transformPage(`<ButtonGroupItem value=1 valueLabel="One"/>`);
		expect(bg).toBe(`{% option value=1 label="One" /%}`);
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

	it('inserts the frontmatter title as an h1 when legacy would have rendered one', () => {
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

	it('drops unconvertible expression props with a MIGRATE-TODO comment', () => {
		const src = `<ReferencePoint data={all_spikes.where(\`category = '\${row.category}'\`)} x=date y=cases label=status color=red />

Check out your page again.`;
		const { content, notes } = transformPage(src);
		expect(content).toContain('{% reference_point x="date" y="cases" label="status" color="red" /%}');
		expect(content).toContain(
			"<!-- MIGRATE-TODO: could not convert expression prop: data={all_spikes.where(`category = '${row.category}'`)} -->"
		);
		expect(content).toContain('Check out your page again.');
		expect(content).not.toContain('data=true');
		expect(notes.some((n) => n.message.includes('MIGRATE-TODO'))).toBe(true);
	});

	it('keeps multi-line array expressions out of the tag and prose intact', () => {
		const src = `<PointMap data={sf} lat=lat long=long tooltip={[
    {id: 'category', showColumnName: false},
    {id: 'status', contentType: 'link'}
]} />`;
		const { content } = transformPage(src);
		expect(content).toContain('{% point_layer data="sf" lat="lat" lng="long" /%}');
		expect(content).toContain('MIGRATE-TODO: could not convert expression prop: tooltip={[');
		expect(content).not.toContain('id=true');
		expect(content).not.toContain('show_column_name=true');
	});

	it('converts flat object literal props to markdoc objects', () => {
		const { content } = transformPage(
			`<LineChart data={q} x=a y=b seriesColors={{'us': 'red', uk: 'blue'}} />`
		);
		expect(content).toContain('chart_options={series_colors={us="red" uk="blue"}}');
	});

	it('converts legacy maps to {% map %} with a layer child', () => {
		const { content, notes } = transformPage(
			`<AreaMap data={zips} areaCol=zip geoJsonUrl='https://x.io/z.geojson' geoId=Z value=sales startingLat=34 startingLong=-118 startingZoom=9 height=500 basemap='https://tiles.x' />`
		);
		expect(content).toContain('{% map zoom=9 height=500 initial_position=[34, -118] %}');
		expect(content).toContain(
			'area_layer\n        data="zips"\n        area_id="zip"\n        geojson_url="https://x.io/z.geojson"\n        geojson_id="Z"\n        value="sales"'
		);
		expect(content).toContain('{% /map %}');
		expect(notes.some((n) => n.message.includes('unsupported in Core: basemap'))).toBe(true);

		const { content: pt } = transformPage(`<PointMap data={sf} lat=lat long=long />`);
		expect(pt).toContain('{% point_layer data="sf" lat="lat" lng="long" /%}');

		const { content: bub } = transformPage(`<BubbleMap data={sf} lat=lat long=long size=cases />`);
		expect(bub).toContain('size_value="cases"');
	});

	it('warns once per Svelte block construct left in the page', () => {
		const { content, notes } = transformPage(
			`{#each rows as row}\n<BigValue data={q} value=sales />\n{/each}\n{#each other as o}\n{/each}\n{#if x > 1}\nhi\n{/if}`
		);
		expect(content).toContain('{#each rows as row}');
		expect(content).toContain('{% big_value');
		expect(notes.filter((n) => n.message.includes('{#each}')).length).toBe(1);
		expect(notes.some((n) => n.message.includes('{#if}'))).toBe(true);
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
