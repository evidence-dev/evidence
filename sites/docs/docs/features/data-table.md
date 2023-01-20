---
sidebar_position: 4
title: Tables
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">&lt;DataTable/></span></h1>

## Example

### Selecting Specific Columns
```html
<DataTable data={query_name} search=true>
    <Column id=date/>
    <Column id=country title="Country Name"/>
    <Column id=value_usd/>
</DataTable>
```

<img src='/img/datatable-selected.png' width='500px'/>

### Displaying All Columns in Query
```html
<DataTable data={query_name} search=true/>
```

<img src='/img/datatable-all.png' width='500px'/>


### Including Images
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

### Links

#### Link Label - Column of Labels
```html
<DataTable data={countries}>
    <Column id=country_url contentType=link linkLabel=country />
    <Column id=country_id align=center />
    <Column id=category />
    <Column id=value_usd />
</DataTable>
```
<img src='/img/datatable-linklabel.png' width='500px'/>

#### Link Label - Consistent String Label
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


## DataTable

### All Options
* **data** - query name, wrapped in curly braces
* **rows** - (Optional) # of rows to show in the table before paginating results. Default is 10 rows
* **rowNumbers** - (Optional) true | false - turns on or off row index numbers (off by default)
* **rowLines** - (Optional) true | false - turns on or off borders at the bottom of each row (on by default)
* **rowShading** - (Optional) true | false - shades every second row in light grey (off by default)
* **sortable** - (Optional) true | false - enable sort for each column - click the column title to sort (on by default)
* **search** - (Optional) true | false - add a search bar to the top of your table (off by default)
* **downloadable** - (Optional) true | false - enable download data button below the table on hover (on by default)
* **formatColumnTitles** - (Optional) true | false - enable auto-formatting of column titles. Turn off to show raw SQL column names (on by default)
* **link** - (Optional) makes each row of your table a clickable link. Accepts the name of a column containing the link to use for each row in your table
* **showLinkCol** - (Optional) true | false - whether to show the column supplied to the `link` prop (false by default)

### Formatting
Formatting is automatically applied based on the column names of your SQL query result. See the [formatting](/features/value-formatting) section for more details.

## Column
Use the `Column` component to choose specific columns to display in your table, and to apply options to specific columns. If you don't supply any columns to the table, it will display all columns from your query result.

### All Options
* **id** - column id (from SQL query)
* **title** - (Optional) override title of column. Evidence will auto-format your column titles, but you can use this prop if the formatted column title is not what you would like
* **align** - (Optional) left | center | right - align header and contents of column
* **contentType** - (Optional) lets you specify how to treat the content within a column. Currently supports `contentType=image` and `contentType=link`. See below for contentType-specific options

### Images
**`contentType=image`**
* **height** - (Optional) height of the image in pixels (e.g., `30px`) - defaults to the original height of the image
* **width** - (Optional) width of the image in pixels - defaults to the original width of the image
* **alt** - (Optional) overrides the alt tag of the image. By default, the alt tag is the name of the image file (excluding the file extension). To override the alt tag, `alt` accepts a column name in your table

### Links
**`contentType=link`**
* **linkLabel** - (Optional) text to show for the link. Can be a string (e.g., `Link &rarr;`) or a column name in your table (e.g., `country_name`)
* **openInNewTab** - (Optional) true | false - on click, whether the link should open in a new tab (false by default - link will open in current tab)




