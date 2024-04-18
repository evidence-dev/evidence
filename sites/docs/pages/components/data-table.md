---
title: Data Table
sidebar_position: 1
---

## Examples

### Selecting Specific Columns

```html
<DataTable data={query_name} search=true>
	<Column id=date />
	<Column id=country title="Country Name" />
	<Column id=value_usd />
</DataTable>
```

<img src='/img/datatable-selected.png' width='500px'/>

### Displaying All Columns in Query

```html
<DataTable data="{query_name}" search="true" />
```

<img src='/img/datatable-all.png' width='500px'/>

### Deltas

```html
<DataTable data={countries}>
	<Column id=country />
	<Column id=category />
	<Column id=value_usd />
    <Column id=yoy contentType=delta fmt=pct title="Y/Y Chg"/>
</DataTable>
```

<img src='/img/datatable-deltas.png' width='500px'/>

### Total Row

```html
<DataTable data={countries} totalRow=true rows=5/>
```

<img src='/img/datatable-totalrow.png' width='650px'/>

#### Default Aggregation Functions

```html
<DataTable data={countries} totalRow=true rows=5>
  <Column id=country/>
  <Column id=gdp_usd totalAgg=sum/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct2'/>
  <Column id=population totalAgg=mean fmt='#,##0"M"'/>
</DataTable>
```

<img src='/img/datatable-totalrow-agg-functions.png' width='650px'/>

#### Custom Aggregations Values

```html
<DataTable data={countries} totalRow=true rows=5>
  <Column id=country totalAgg="Just the USA"/>
  <Column id=gdp_usd totalAgg={countries[0].gdp_usd} totalFmt=usd/>
</DataTable>
```

<img src='/img/datatable-totalrow-agg-custom.png' width='650px'/>

#### Custom Total Formats

```html
<DataTable data={countries} totalRow=true rows=5>
  <Column id=country totalAgg="All Countries"/>
  <Column id=continent totalAgg=countDistinct totalFmt='# "Unique continents"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"'/>
  <Column id=gdp_growth totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=interest_rate totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=inflation_rate totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=jobless_rate totalAgg=mean fmt='pct0'/>
  <Column id=gov_budget totalAgg=mean fmt='0.0"%"'/>
  <Column id=debt_to_gdp totalAgg=mean fmt='0"%"'/>
  <Column id=current_account totalAgg=mean fmt='0.0"%"'/>
  <Column id=population totalAgg=sum fmt='#,##0"M"'/>
</DataTable>
```

<img src='/img/datatable-totalrow-fmt.png' width='650px'/>

### Conditional Formatting

#### Default (`scaleColor=green`)
```html
<DataTable data={countries}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale/>
</DataTable>
```

<img src='/img/conditional-fmt-green.png' width='500px'/>


#### `scaleColor=red`

```html
<DataTable data={countries}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale scaleColor=red/>
</DataTable>
```

<img src='/img/conditional-fmt-red.png' width='500px'/>

#### `scaleColor=blue`

```html
<DataTable data={countries}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale scaleColor=blue/>
</DataTable>
```

<img src='/img/conditional-fmt-blue.png' width='500px'/>

#### Custom Colors

When you pass a custom color to `scaleColor`, Evidence will create a color palette for you, starting at white and ending at the color you provided. See examples further down the page to see how to specify a custom color palette with multiple colors.

```html
<DataTable data={orders_by_category} rowNumbers=true>
  <Column id=month/>
  <Column id=category/>
  <Column id=sales_usd0k contentType=colorscale scaleColor=#a85ab8 align=center/>
  <Column id=num_orders_num0 contentType=colorscale scaleColor=#e3af05 align=center/>
  <Column id=aov_usd2 contentType=colorscale scaleColor=#c43957 align=center/>
</DataTable>
```

<img src='/img/table-custom-colors.png' width='600px'/>

### Custom Color Palettes

#### Diverging Scale

```html
<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#6db678','white','#ce5050']}/>
</DataTable>
```

<img src='/img/condfmt-diverging.png' width='600px'/>

#### Heatmap
```html
<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#6db678','#ebbb38','#ce5050']}/>
</DataTable>
```

<img src='/img/condfmt-heatmap.png' width='600px'/>

#### Color Breakpoints
Use `colorBreakpoints` or `colorMid`/`colorMin`/`colorMax` to control which values are assigned to which sections of the color scale

```html
<DataTable data={negatives} rows=all>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#ce5050','white','#6db678']} colorMid=0/>
</DataTable>
```
<img src='/img/condfmt-negative.png' width='600px'/>

### Including Images
You can include images by indicating either an absolute path e.g. `https://www.example.com/images/image.png` or a relative path e.g. `/images/image.png`. For relative paths, see [storing static files in a static folder](/reference/markdown/#storing-images-and-static-files). 

In this example, `flag` is either an absolute path or a relative path to the image.

```html
<DataTable data={countries}>
	<Column id=flag contentType=image height=30px align=center />
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>
```

<img src='/img/datatable-image.png' width='500px'/>

### Link Columns

#### Link Column with Unique Labels

```html
<DataTable data={countries}>
	<Column id=country_url contentType=link linkLabel=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>
```

<img src='/img/datatable-linklabel.png' width='500px'/>

#### Link Column with Consistent String Label

```html
<DataTable data={countries}>
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
	<Column id=country_url contentType=link linkLabel="Details &rarr;" />
</DataTable>
```

<img src='/img/datatable-linklabel-string.png' width='500px'/>

### HTML Content

````markdown
```sql html_in_table
select '<b>Bold</b> text' as "HTML in Table", 0 as row_number union all
select '<i>Italic</i> text', 1 union all
select '<a href="https://evidence.dev">Link</a>', 2 union all
select '<img src="https://raw.githubusercontent.com/evidence-dev/media-kit/main/png/wordmark-gray-800.png" width="200px"/>', 3 union all
select 'Inline <code class=markdown>Code</code></br> is supported', 4
order by row_number
```

<DataTable data={html_in_table}>
    <Column id="HTML in Table" contentType=html/>
</DataTable>
````

<img src='/img/datatable-html.png' width='500px'/>

To apply styling to most HTML tags, you should add the `class=markdown` attribute to the tag in your column. This will apply the same styling as the markdown renderer.

### Row Links

#### External Links

This example includes a column `country_url` which contains a country name as a search term in Google (e.g., `https://google.ca/search?q=canada`)

```html
<DataTable data={countries} search=true link=country_url>
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>
```

<img src='/img/datatable-rowlink-external.gif' width='500px'/>

#### Link to Pages in Your Project

In this example, the SQL query contains a column with links to parameterized pages in the project. Below is an example of the SQL that could be used to generate such links:

```sql
select
    category,
    '/parameterized-pages/' || category as category_link,
    sum(sales) as sales_usd0
from needful_things.orders
group by 1
```

You can then use the `link` property of the DataTable to use your link column as a row link (`category_link` in this example):

```html
<DataTable data={orders} link=category_link />
```

By default, the link column of your table is hidden. If you would like it to be displayed in the table, you can use `showLinkCol=true`.

<img src='/img/datatable-internal-linkedtable.gif' width='500px'/>

### Styling

#### Row Shading + Row Lines

```html
<DataTable data={countries} rowShading=true />
```

<img src='/img/datatable-rowshading.png' width='500px'/>

#### Row Shading + No Row Lines

```html
<DataTable data={countries} rowShading=true rowLines=false />
```

<img src='/img/datatable-rowshading-nolines.png' width='500px'/>

#### No Lines or Shading

```html
<DataTable data={countries} rowLines=false />
```

<img src='/img/datatable-nolines.png' width='500px'/>

### Column Alignment

```html
<DataTable data={query_name}>
	<Column id=country align=right />
	<Column id=country_id align=center />
	<Column id=category align=left />
	<Column id=value_usd align=left />
</DataTable>
```

<img src='/img/datatable-align.png' width='500px'/>

### Custom Column Titles

```html
<DataTable data={query_name}>
	<Column id=country title="Country Name" />
	<Column id=country_id align=center title="ID" />
	<Column id=category align=center title="Product Category" />
	<Column id=value_usd title="Sales in 2022" />
</DataTable>
```

<img src='/img/datatable-coltitle-override.png' width='500px'/>

### Raw Column Names

```html
<DataTable data={query_name} formatColumnTitles=false />
```

<img src='/img/datatable-raw-colnames.png' width='500px'/>

### Groups - Accordion

#### Without subtotals

```html
<DataTable data={orders} groupBy=state>
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>
```

<img src='/img/tbl-accordion-nosub.png' width='500px'/>

#### With Subtotals

```html
<DataTable data={orders} groupBy=state subtotals=true> 
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>
```

<img src='/img/tbl-accordion-sub.png' width='500px'/>

#### Closed by Default

```html
<DataTable data={orders} groupBy=state subtotals=true totalRow=true groupsOpen=false> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=countDistinct totalFmt='[=1]0 "category";0 "categories"'/> 
	<Column id=item  totalAgg=countDistinct totalFmt='[=1]0 "item";0 "items"'/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
</DataTable>
```

<img src='/img/tbl-accordion-closed.png' width='500px'/>

#### With Configured Columns

```html
<DataTable data={orders} groupBy=category subtotals=true totalRow=true> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
</DataTable>
```

<img src='/img/tbl-accordion-configured.png' width='500px'/>

### Groups - Section

#### Without subtotals

```html
<DataTable data={orders} groupBy=state groupType=section/>
```

<img src='/img/tbl-section-nosub.png' width='500px'/>

#### With Subtotals

```html
<DataTable data={orders} groupBy=state subtotals=true groupType=section>
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>
```

<img src='/img/tbl-section-sub.png' width='500px'/>

#### With Configured Columns

```html
<DataTable data={orders} groupBy=category groupType=section subtotals=true totalRow=true totalRowColor=#fff0cc> 
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>
```

<img src='/img/tbl-section-configured.png' width='500px'/>

### Column Groups

```html
<DataTable data={countries} totalRow=true rows=5 wrapTitles groupBy=continent groupType=section totalRowColor=#f2f2f2>
  <Column id=continent totalAgg="Total" />
  <Column id=country totalAgg=countDistinct totalFmt='0 "countries"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"' colGroup="GDP"/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' colGroup="GDP" contentType=delta/>
  <Column id=jobless_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' contentType=colorscale scaleColor=red colGroup="Labour Market"/>
  <Column id=population totalAgg=sum fmt='#,##0"M"' totalFmt='#,##0.0,"B"' colGroup="Labour Market"/>
</DataTable>
```

<img src='/img/colgroups.png' width='500px'/>

### Wrap Titles

```html
<DataTable data={economics} wrapTitles=true /> 
```

<img src='/img/wrap-titles.png' width='700px'/>

# DataTable

## Options

<PropListing
    name=data
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing
    name=rows
    description="Number of rows to show in the table before paginating results. Use `rows=all` to show all rows in the table."
    required=false
    options="number | all"
    defaultValue=10
/>
<PropListing
    name=totalRow
    description="Show a total row at the bottom of the table, defaults to sum of all numeric columns"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=totalRowColor
    description="Background color of the total row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=totalFontColor
    description="Font color of the total row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=rowNumbers
    description="Turns on or off row index numbers"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=rowLines
    description="Turns on or off borders at the bottom of each row"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=rowShading
    description="Shades every second row in light grey"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=backgroundColor
    description="Background color of the table"
    required=false
    options="Hex color code | css color name"
    defaultValue="-"
/>
<PropListing
    name=sortable
    description="Enable sort for each column - click the column title to sort"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>  
<PropListing
    name=search
    description="Add a search bar to the top of your table"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=downloadable
    description="Enable download data button below the table on hover"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=formatColumnTitles
    description="Enable auto-formatting of column titles. Turn off to show raw SQL column names"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=wrapTitles
    description="Wrap column titles"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=compact
    description="Enable a more compact table view that allows more content vertically and horizontally"
    options={['true', 'false']}
    defaultValue=false
/>

<PropListing
    name=link
    description="Makes each row of your table a clickable link. Accepts the name of a column containing the link to use for each row in your table"
    required=false
    options="column name"
    defaultValue="-"
/>
<PropListing
    name=showLinkCol
    description="Whether to show the column supplied to the `link` prop"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=generateMarkdown
    description="Helper for writing DataTable syntax with many columns. When set to true, markdown for the DataTable including each `Column` contained within the query will be generated and displayed below the table."
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    required=false
    options={["error", "warn", "pass"]}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    required=false
    options="string"
    defaultValue="No records"
/>

### Groups
Groups allow you to create sections within your table, increasing the density of the content you're displaying. Groups are currently limited to 1 level, but will be expanded in future versions.

<PropListing
    name=groupBy
    description="Column to use to create groups. Note that groups are currently limited to a single group column."
    required=false
    options="column name"
/>
<PropListing
    name=groupType
    description="How the groups are shown in the table. Can be accordion (expand/collapse) or section (group column values are merged across rows)"
    required=false
    options={['accordion', 'section']}
    defaultValue="accordion"
/>
<PropListing
    name=subtotals
    description="Whether to show aggregated totals for the groups"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=subtotalFmt
    description="Specify an override format to use in the subtotal row (<a href='/core-concepts/formatting'>see available formats</a>). Custom strings or values are unformatted by default."
    required=false
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=groupsOpen
    description="[groupType=accordion] Whether to show the accordions as open on page load"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=accordionRowColor
    description="[groupType=accordion] Background color for the accordion row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=subtotalRowColor
    description="[groupType=section] Background color for the subtotal row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=subtotalFontColor
    description="[groupType=section] Font color for the subtotal row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=groupNamePosition
    description="[groupType=section] Where the group label will appear in its cell"
    required=false
    options={['top', 'middle', 'bottom']}
    defaultValue="middle"
/>


# Column

Use the `Column` component to choose specific columns to display in your table, and to apply options to specific columns. If you don't supply any columns to the table, it will display all columns from your query result.

## Options

<PropListing
    name=id
    description="Column id (from SQL query)"
    required=true
    options="column name"
/>
<PropListing
    name=title
    description="Override title of column"
    options="string"
    defaultValue="column name (formatted)"
/>
<PropListing
    name=align
    description="Align column text"
    options={['left', 'center', 'right']}
    defaultValue="left"
/>
<PropListing
    name=fmt
    description="Format the values in the column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=totalAgg
    description="Specify an aggregation function to use for the total row. Accepts predefined functions, custom strings or values"
    options={['sum', 'mean', 'weightedMean', 'median', 'min', 'max', 'count', 'countDistinct', 'custom string or value']}
    defaultValue="sum"
/>
<PropListing
    name=totalFmt
    description="Specify an override format to use in the total row (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>). Custom strings or values are unformatted by default."
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=weightCol
    description="Column to use as the weight values for weighted mean aggregation. If not specified, a weight of 1 for each value will be used and the result will be the same as the `mean` aggregation."
    options="column name"
/>
<PropListing
    name=wrap
    description="Wrap column text"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=wrapTitle
    description="Wrap column title"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=contentType
    description="Lets you specify how to treat the content within a column. See below for contentType-specific options."
    options={['link', 'image', 'delta', 'colorscale', 'html']}
/>
<PropListing
    name=colGroup
    description="Group name to display above a group of columns. Columns with the same group name will get a shared header above them"
    options="string"
/>

### Images

`contentType=image`

<PropListing
    name=height
    description="Height of image in pixels"
    options="number"
    defaultValue="original height of image"
/>
<PropListing
    name=width
    description="Width of image in pixels"
    options="number"
    defaultValue="original width of image"
/>
<PropListing
    name=alt
    description="Alt text for image"
    options="column name"
    defaultValue="Name of the image file (excluding the file extension)"
/>

### Links

`contentType=link`

<PropListing
    name=linkLabel
    description="Text to display for link"
    options="column name | string"
    defaultValue="raw url"
/>
<PropListing
    name=openInNewTab
    description="Whether to open link in new tab"
    options={['true', 'false']}
    defaultValue="false"
/>

### Deltas

`contentType=delta`

<PropListing
    name=deltaSymbol
    description="Whether to show the up/down delta arrow symbol"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=downIsGood
    description="If present, negative comparison values appear in green, and positive values appear in red."
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=showValue
    description="Whether to show the delta value. Set this to false to show only the delta arrow indicator."
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=neutralMin
    description="Start of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=neutralMax
    description="End of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=chip
    description="Whether to display the delta as a 'chip', with a background color and border."
    options={['true', 'false']}
    defaultValue="false"
/>

### Conditional Formatting (Color Scales)

`contentType=colorscale`

<PropListing
    name=scaleColor
    description="Color to use for the scale"
    options={['green', 'blue', 'red', 'Hex color code', 'css color name']}
    defaultValue="green"
/>
<PropListing
    name=colorMin
    description="Set a minimum for the scale. Any values below that minimum will appear in the lowest color on the scale"
    options="number"
    defaultValue="min of column"
/>
<PropListing
    name=colorMid
    description="Set a midpoint for the scale"
    options="number"
    defaultValue="mid of column"
/>
<PropListing
    name=colorMax
    description="Set a maximum for the scale. Any values above that maximum will appear in the highest color on the scale"
    options="number"
    defaultValue="max of column"
/>
<PropListing
    name=colorBreakpoints
    description="Array of numbers to use as breakpoints for each color in your color scale. Should line up with the colors you provide in <code>scaleColor</code>"
    options="array of numbers"
/>

### HTML

`contentType=html`

To apply styling to HTML tags, you will need to add the `class=markdown` attribute **to the HTML tag in your column**. This will apply the same styling as the markdown renderer. E.g., `<code class=markdown>Code</code>`