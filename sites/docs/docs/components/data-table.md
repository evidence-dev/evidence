---
sidebar_position: 3
title: Data Table

hide_table_of_contents: false
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



### Including Images
You can include images by indicating either an absolute path e.g. `https://www.example.com/images/image.png` or a relative path e.g. `/images/image.png`. For relative paths, see [storing static files in a static folder](/markdown/#storing-images-and-static-files). 

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




## DataTable

### Options

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>data</td>	
        <td>Query name, wrapped in curly braces</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>query name</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>rows</td>	
        <td>Number of rows to show in the table before paginating results. Use <code>rows=all</code> to show all rows in the table.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>number | all</td>	
        <td class='tcenter'>10</td>
    </tr>
    <tr>	
        <td>totalRow</td>	
        <td>Show a total row at the bottom of the table, defaults to sum of all numeric columns</td>
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>totalRowColor</td>	
        <td>Background color of the total row</td>
        <td class='tcenter'>-</td>	
        <td class='tcenter'>Hex color code | css color name</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>totalFontColor</td>	
        <td>Font color of the total row</td>
        <td class='tcenter'>-</td>	
        <td class='tcenter'>Hex color code | css color name</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>rowNumbers</td>	
        <td>Turns on or off row index numbers</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>rowLines</td>	
        <td>Turns on or off borders at the bottom of each row</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>true</td>
    </tr>
    <tr>	
        <td>rowShading</td>	
        <td>Shades every second row in light grey</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>    
        <td>backgroundColor</td>
        <td>Background color of the table</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>Hex color code | css color name</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>sortable</td>	
        <td>Enable sort for each column - click the column title to sort</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>true</td>
    </tr>
    <tr>	
        <td>search</td>	
        <td>Add a search bar to the top of your table</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>downloadable</td>	
        <td>Enable download data button below the table on hover</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>true</td>
    </tr>
    <tr>	
        <td>formatColumnTitles</td>	
        <td>Enable auto-formatting of column titles. Turn off to show raw SQL column names</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>true</td>
    </tr>
    <tr>	
        <td>wrapTitles</td>	
        <td>Wrap column titles</td>
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>link</td>	
        <td>Makes each row of your table a clickable link. Accepts the name of a column containing the link to use for each row in your table</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>showLinkCol</td>	
        <td>Whether to show the column supplied to the <code>link</code> prop</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>generateMarkdown</td>
        <td>Helper for writing DataTable syntax with many columns. When set to true, markdown for the DataTable including each <code>Column</code> contained within the query will be generated and displayed below the table. </td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
</table>

### Groups
Groups allow you to create sections within your table, increasing the density of the content you're displaying. Groups are currently limited to 1 level, but will be expanded in future versions.

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>groupBy</td>	
        <td>Column to use to create groups. Note that groups are currently limited to a single group column.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>groupType</td>	
        <td>How the groups are shown in the table. Can be accordion (expand/collapse) or section (group column values are merged across rows)</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>accordion | section</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>subtotals</td>	
        <td>Whether to show aggregated totals for the groups</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>	
    </tr>
    <tr>	
        <td>subtotalFmt</td>
        <td>Specify an override format to use in the subtotal row (<a href='/core-concepts/formatting'>see available formats</a>). Custom strings or values are unformatted by default.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>groupsOpen</td>	
        <td>[groupType=accordion] Whether to show the accordions as open on page load</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>true</td>	
    </tr>
    <tr>	
        <td>accordionRowColor</td>	
        <td>[groupType=accordion] Background color for the accordion row</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>Hex color code | css color name</td>
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>subtotalRowColor</td>	
        <td>[groupType=section] Background color for the subtotal row</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>Hex color code | css color name</td>
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>subtotalFontColor</td>	
        <td>[groupType=section] Font color for the subtotal row</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>Hex color code | css color name</td>
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>groupNamePosition</td>	
        <td>[groupType=section] Where the group label will appear in its cell</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>top | middle | bottom</td>
        <td class='tcenter'>middle</td>	
    </tr>
</table>

## Column

Use the `Column` component to choose specific columns to display in your table, and to apply options to specific columns. If you don't supply any columns to the table, it will display all columns from your query result.

### Options

<table>
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>id</td>	
        <td>Column id (from SQL query)</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>title</td>	
        <td>Override title of column</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>column name (formatted)</td>
    </tr>
    <tr>	
        <td>align</td>
        <td>Align column text</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>left | center | right</td>
        <td class='tcenter'>left</td>
    </tr>
    <tr>	
        <td>fmt</td>
        <td>Format the values in the column (<a href='/core-concepts/formatting'>see available formats</a>)</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>totalAgg</td>
        <td>Specify an aggregation function to use for the total row. Accepts predefined functions, custom strings or values</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>sum | mean | weightedMean | median | min | max | count | countDistinct | custom string or value</td>
        <td class='tcenter'>sum</td>
    </tr>
    <tr>	
        <td>totalFmt</td>
        <td>Specify an override format to use in the total row (<a href='/core-concepts/formatting'>see available formats</a>). Custom strings or values are unformatted by default.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>weightCol</td>
        <td>Column to use as the weight values for weighted mean aggregation. If not specified, a weight of 1 for each value will be used and the result will be the same as the <code>mean</code> aggregation.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>column name</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>wrap</td>
        <td>Wrap column text</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>wrapTitle</td>
        <td>Wrap column title</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>contentType</td>
        <td>Lets you specify how to treat the content within a column. See below for contentType-specific options.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>link | image | delta | colorscale</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>colGroup</td>
        <td>Group name to display above a group of columns. Columns with the same group name will get a shared header above them </td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>string</td>
        <td class='tcenter'>-</td>
    </tr>
</table>

### Images

`contentType=image`

<table>
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>
        <td>height</td>
        <td>Height of image in pixels</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>original height of image</td>
    </tr>
    <tr>
        <td>width</td>
        <td>Width of image in pixels</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>original width of image</td>
    </tr>
    <tr>
        <td>alt</td>
        <td>Alt text for image</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>column name</td>
        <td class='tcenter'>Name of the image file (excluding the file extension)</td>
    </tr>
</table>

### Links

`contentType=link`

<table>
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>
        <td>linkLabel</td>
        <td>Text to display for link</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>column name | string</td>
        <td class='tcenter'>raw url</td>
    </tr>
    <tr>
        <td>openInNewTab</td>
        <td>Whether to open link in new tab</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
</table>


### Deltas

`contentType=delta`

<table>
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>
        <td>deltaSymbol</td>
        <td>Whether to show the up/down delta arrow symbol</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>true</td>
    </tr>
    <tr>
        <td>downIsGood</td>
        <td>If present, negative comparison values appear in green, and positive values appear in red.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>
        <td>showValue</td>
        <td>Whether to show the delta value. Set this to false to show only the delta arrow indicator.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>true</td>
    </tr>
    <tr>
        <td>neutralMin</td>
        <td>Start of the range for "neutral" values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>0</td>
    </tr>
    <tr>
        <td>neutralMax</td>
        <td>End of the range for "neutral" values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>0</td>
    </tr>
    <tr>
        <td>chip</td>
        <td>Whether to display the delta as a "chip", with a background color and border.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
</table>

### Conditional Formatting (Color Scales)

`contentType=colorscale`

<table>
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>
        <td>scaleColor</td>
        <td>Color to use for the scale</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>green | blue | red | Hex color code | css color name</td>
        <td class='tcenter'>green</td>
    </tr>
    <tr>
        <td>colorMin</td>
        <td>Set a minimum for the scale. Any values below that minimum will appear in the lowest color on the scale</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>number</td>
        <td class='tcenter'>min of column</td>
    </tr>
    <tr>
        <td>colorMax</td>
        <td>Set a maximum for the scale. Any values above that maximum will appear in the highest color on the scale</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>max of column</td>
    </tr>
</table>