---
sidebar_position: 3
title: Data Table

hide_table_of_contents: false
---

## Examples

### Selecting Specific Columns

```html
<DataTable data="{query_name}" search="true">
	<Column id="date" />
	<Column id="country" title="Country Name" />
	<Column id="value_usd" />
</DataTable>
```

<img src='/img/datatable-selected.png' width='500px'/>

### Displaying All Columns in Query

```html
<DataTable data="{query_name}" search="true" />
```

<img src='/img/datatable-all.png' width='500px'/>

### Including Images

```html
<DataTable data="{countries}">
	<Column id="flag" contentType="image" height="30px" align="center" />
	<Column id="country" />
	<Column id="country_id" align="center" />
	<Column id="category" />
	<Column id="value_usd" />
</DataTable>
```

<img src='/img/datatable-image.png' width='500px'/>

### Link Columns

#### Link Column with Unique Labels

```html
<DataTable data="{countries}">
	<Column id="country_url" contentType="link" linkLabel="country" />
	<Column id="country_id" align="center" />
	<Column id="category" />
	<Column id="value_usd" />
</DataTable>
```

<img src='/img/datatable-linklabel.png' width='500px'/>

#### Link Column with Consistent String Label

```html
<DataTable data="{countries}">
	<Column id="country" />
	<Column id="country_id" align="center" />
	<Column id="category" />
	<Column id="value_usd" />
	<Column id="country_url" contentType="link" linkLabel="Details &rarr;" />
</DataTable>
```

<img src='/img/datatable-linklabel-string.png' width='500px'/>

### Row Links

#### External Links

This example includes a column `country_url` which contains a country name as a search term in Google (e.g., `https://google.ca/search?q=canada`)

```html
<DataTable data="{countries}" search="true" link="country_url">
	<Column id="country" />
	<Column id="country_id" align="center" />
	<Column id="category" />
	<Column id="value_usd" />
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
from orders
group by 1
```

You can then use the `link` property of the DataTable to use your link column as a row link (`category_link` in this example):

```html
<DataTable data="{orders}" link="category_link" />
```

By default, the link column of your table is hidden. If you would like it to be displayed in the table, you can use `showLinkCol=true`.

<img src='/img/datatable-internal-linkedtable.gif' width='500px'/>

### Styling

#### Row Shading + Row Lines

```html
<DataTable data="{countries}" rowShading="true" />
```

<img src='/img/datatable-rowshading.png' width='500px'/>

#### Row Shading + No Row Lines

```html
<DataTable data="{countries}" rowShading="true" rowLines="false" />
```

<img src='/img/datatable-rowshading-nolines.png' width='500px'/>

#### No Lines or Shading

```html
<DataTable data="{countries}" rowLines="false" />
```

<img src='/img/datatable-nolines.png' width='500px'/>

### Column Alignment

```html
<DataTable data="{query_name}">
	<Column id="country" align="right" />
	<Column id="country_id" align="center" />
	<Column id="category" align="left" />
	<Column id="value_usd" align="left" />
</DataTable>
```

<img src='/img/datatable-align.png' width='500px'/>

### Custom Column Titles

```html
<DataTable data="{query_name}">
	<Column id="country" title="Country Name" />
	<Column id="country_id" align="center" title="ID" />
	<Column id="category" align="center" title="Product Category" />
	<Column id="value_usd" title="Sales in 2022" />
</DataTable>
```

<img src='/img/datatable-coltitle-override.png' width='500px'/>

### Raw Column Names

```html
<DataTable data="{query_name}" formatColumnTitles="false" />
```

<img src='/img/datatable-raw-colnames.png' width='500px'/>

## DataTable

### All Options

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
</table>

### Formatting

Formatting is automatically applied based on the column names of your SQL query result. See the [formatting](/core-concepts/formatting) section for more details.

## Column

Use the `Column` component to choose specific columns to display in your table, and to apply options to specific columns. If you don't supply any columns to the table, it will display all columns from your query result.

### All Options

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
        <td>wrap</td>
        <td>Wrap column text</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>contentType</td>
        <td>Lets you specify how to treat the content within a column. See below for contentType-specific options.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>link | image</td>
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
