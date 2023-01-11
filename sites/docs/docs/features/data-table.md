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
![datatable](/img/datatable-selected.png)

### Displaying All Columns in Query
```html
<DataTable data={query_name} search=true/>
```

![datatable](/img/datatable-all.png)


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

### Formatting
Formatting is automatically applied based on the column names of your SQL query result. See the [formatting](/features/value-formatting) section for more details.

## Column
Use the `Column` component to choose specific columns to display in your table. If you don't supply any columns to the table, it will display all columns from your query result.

### All Options
* **id** - column id (from SQL query)
* **title** - (Optional) override title of column. Evidence will auto-format your column titles, but you can use this prop if the formatted column title is not what you would like
* **align** - (Optional) left | center | right - align header and contents of column



