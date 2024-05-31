---
sidebar_position: 6
title: 'Value Formatting'
description: 'Number and date formatting options in Evidence'
---

The easiest way to format numbers and dates in Evidence is through component props. You can pass in any of the following:
- [Excel-style format codes](#excel-format-codes) (e.g., `fmt='$#,##0.0'`)
- Evidence's [built-in formats](#built-in-formats) (e.g., `fmt=usd2k`)
- [Custom defined formats](#custom-formats)

For example, you can use the `fmt` prop to format values inside a Value component:

```html
<Value data={sales_data} column=sales fmt='$#,##0' />
```

Within charts, you can format individual columns using `xFmt` and `yFmt` (and `sizeFmt` for bubble charts):

```html
<LineChart 
    data={sales_data} 
    x=date 
    y=sales 
    xFmt="m/d"
    yFmt="eur"
/>
```

In the example above, `xFmt` is passing in an Excel-style code to format the dates and `yFmt` is referencing a built-in format ([see the full list](#built-in-formats) of supported tags below, or [create your own](#custom-formats)).

<Alert status=info>

**Date formatting**

Formatting does not apply to the date axis of a chart. For example, if you set `xFmt` to `m/d/yy`, you will only see that formatting reflected in your chart tooltips and annotations. This is to ensure that the chart axis labels have the correct spacing.

</Alert>


#### Reusable Formats
For a more reusable approach, you can use [SQL format tags](#sql-format-tags), which let you define formats within your SQL. This guarantees that your columns will be formatted in the same way wherever they are used in Evidence.

You can also create your own [custom formats](#custom-formats), which are format codes you can reuse across your project.

#### Formatting Directly in Markdown
If you need to format values outside of components, [the format function](#format-function) can be used directly. For example, when using [expressions](/core-concepts/syntax#expressions) it is not possible to use component props or format tags.

## Excel Format Codes
Evidence supports [Excel-style custom format codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68), which can be passed directly to a component prop, the [format function](#format-function), or saved as a [custom format code](#custom-formats) that you want to reuse.

<Alert status=info>

**Strings inside formats codes**

Some Excel format codes include strings: use double-quotes for the string, and single-quotes to surround the whole format code. 

E.g., `fmt = '#,##0.00 "mpg"'`

</Alert>

## Built-in Formats
Evidence supports a variety of date/time, number, percentage, and currency formats. You can find the full list of formats below.

<!-- These are pasted in from the settings menu HTML, with edits -->

### Auto-Formatting

Wherever you see `auto` listed beside a format, that means Evidence will automatically format your value based on the context it is in.

For example, Evidence automatically formats large numbers into shortened versions based on the size of the median number in a column (e.g., 4,000,000 &rarr; 4M).

You can choose to handle these numbers differently by choosing a specific format code. For example, if Evidence is formatting a column as millions, but you want to see all numbers in thousands, you could use the `num0k` format, which will show all numbers in the column in thousands with 0 decimal places.

### Dates


```sql date_formats
select 'ddd' as format_name, 'ddd' as format_code, '2022-01-09 12:45' as example_input, 'Sun' as example_output, 0 as row_num union all
select 'dddd', 'dddd', '2022-01-09 12:45', 'Sunday', 1 union all
select 'mmm', 'mmm', '2022-01-09 12:45', 'Jan', 2 union all
select 'mmmm', 'mmmm', '2022-01-09 12:45', 'January', 3 union all
select 'yyyy', 'yyyy', '2022-01-09 12:45', '2022', 4 union all
select 'shortdate', 'mmm d/yy', '2022-01-09 12:45', 'Jan 9/22', 5 union all
select 'longdate', 'mmmm d, yyyy', '2022-01-09 12:45', 'January 9, 2022', 6 union all
select 'fulldate', 'dddd mmmm d, yyyy', '2022-01-09 12:45', 'Sunday January 9, 2022', 7 union all
select 'mdy', 'm/d/y', '2022-01-09 12:45', '1/9/22', 8 union all
select 'dmy', 'd/m/y', '2022-01-09 12:45', '9/1/22', 9 union all
select 'hms', 'H:MM:SS AM/PM', '2022-01-09 12:45', '11:45:03 AM', 10
order by row_num
```

<DataTable data={date_formats} rows=all>
    <Column id="format_name" />
    <Column id="format_code" />
    <Column id="example_input" align=right/>
    <Column id="example_output" align=right/>
</DataTable>


### Currencies

Supported currencies:


```sql currency_formats
select 'usd' as code, 'United States Dollar' as currency, 0 as row_num union all
select 'aud', 'Australian Dollar', 1 union all
select 'brl', 'Brazilian Real', 2 union all
select 'cad', 'Canadian Dollar', 3 union all
select 'cny', 'Renminbi', 4 union all
select 'eur', 'Euro', 5 union all
select 'gbp', 'Pound Sterling', 6 union all
select 'jpy', 'Japanese Yen', 7 union all
select 'inr', 'Indian Rupee', 8 union all
select 'krw', 'South Korean Won', 9 union all
select 'ngn', 'Nigerian Naira', 10 union all
select 'rub', 'Russian Ruble', 11 union all
select 'sek', 'Swedish Krona', 12
order by row_num
```

<DataTable data={currency_formats} rows=all>
    <Column id="code" />
    <Column id="currency" />
</DataTable>

In order to use currency tags, use the currency code, optionally appended with:

- a number indicating the number of decimal places to show (0-2)
- a letter indication the order of magnitude to show ("","k", "m", "b")

For example, the available tags for USD are:


```sql usd_formats
select 'usd' as format_name, 'auto' as format_code, 412.17 as example_input, '$412' as example_output, 0 as row_num union all
select 'usd0', '$#,##0', '7043.123', '$7,043', 1 union all
select 'usd1', '$#,##0.0', '7043.123', '$7,043.1', 2 union all
select 'usd2', '$#,##0.00', '7043.123', '$7,043.12', 3 union all
select 'usd0k', '$#,##0,"k"', '64301.12', '$64k', 4 union all
select 'usd1k', '$#,##0.0,"k"', '64301.12', '$64.3k', 5 union all
select 'usd2k', '$#,##0.00,"k"', '64301.12', '$64.30k', 6 union all
select 'usd0m', '$#,##0,,"M"', '4564301.12', '$5M', 7 union all
select 'usd1m', '$#,##0.0,,"M"', '4564301.12', '$4.6M', 8 union all
select 'usd2m', '$#,##0.00,,"M"', '4564301.12', '$4.56M', 9 union all
select 'usd0b', '$#,##0,,,"B"', '9784564301.12', '$10B', 10 union all
select 'usd1b', '$#,##0.0,,,"B"', '9784564301.12', '$9.8B', 11 union all
select 'usd2b', '$#,##0.00,,,"B"', '9784564301.12', '$9.78B', 12
order by row_num
```

<DataTable data={usd_formats} rows=all>
    <Column id="format_name" />
    <Column id="format_code" />
    <Column id="example_input" align=right/>
    <Column id="example_output" align=right/>
</DataTable>



### Numbers
The default number format (when no `fmt` is specified) automatically handles decimal places and summary units (in the same way that `usd` does for currency).

```sql number_formats
select 'num0' as format_name, '#,##0' as format_code, '11.23168' as example_input, '11' as example_output, 0 as row_num union all
select 'num1', '#,##0.0', '11.23168', '11.2', 1 union all
select 'num2', '#,##0.00', '11.23168', '11.23', 2 union all
select 'num3', '#,##0.000', '11.23168', '11.232', 3 union all
select 'num4', '#,##0.0000', '11.23168', '11.2317', 4 union all
select 'num0k', '#,##0,"k"', '64201', '64k', 5 union all
select 'num1k', '#,##0.0,"k"', '64201', '64.2k', 6 union all
select 'num2k', '#,##0.00,"k"', '64201', '64.20k', 7 union all
select 'num0m', '#,##0,,"M"', '42539483', '43M', 8 union all
select 'num1m', '#,##0.0,,"M"', '42539483', '42.5M', 9 union all
select 'num2m', '#,##0.00,,"M"', '42539483', '42.54M', 10 union all
select 'num0b', '#,##0,,,"B"', '1384937584', '1B', 11 union all
select 'num1b', '#,##0.0,,,"B"', '1384937584', '1.4B', 12 union all
select 'num2b', '#,##0.00,,,"B"', '1384937584', '1.38B', 13 union all
select 'id', '0', '921594675', '921594675', 14 union all
select 'fract', '# ?/?', '0.25', '1/4', 15 union all
select 'mult', '#,##0.0"x"', '5.32', '5.3x', 16 union all
select 'mult0', '#,##0"x"', '5.32', '5x', 17 union all
select 'mult1', '#,##0.0"x"', '5.32', '5.3x', 18 union all
select 'mult2', '#,##0.00"x"', '5.32', '5.32x', 19 union all
select 'sci', '0.00E+0', '16546.1561', '1.65E+4', 20
order by row_num
```

<DataTable data={number_formats} rows=all>
    <Column id="format_name" />
    <Column id="format_code" />
    <Column id="example_input" align=right/>
    <Column id="example_output" align=right/>
</DataTable>


### Percentages


```sql percentage_formats
select 'pct' as format_name, 'auto' as format_code, 0.731 as example_input, '73.1%' as example_output, 0 as row_num union all
select 'pct0', '#,##0%', 0.731, '73%', 1 union all
select 'pct1', '#,##0.0%', 0.731, '73.1%', 2 union all
select 'pct2', '#,##0.00%', 0.731, '73.10%', 3 union all
select 'pct3', '#,##0.000%', 0.731, '73.100%', 4
order by row_num
```

<DataTable data={percentage_formats} rows=all>
    <Column id="format_name" />
    <Column id="format_code" />
    <Column id="example_input" />
    <Column id="example_output" align=right/>
</DataTable>



## Custom Formats

Custom formats can be added in the Value Formatting Section of the Evidence Settings. 

With custom formats, you define the format you want to use (using [Excel style custom format codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68)), and give the format a name (e.g., `mydate`). That format name will now be accessible in any place you can format your data in Evidence. For example:

```html
<Value data={sales_data} column=date fmt=mydate />
```


## SQL Format Tags

SQL format tags let you define formats for your columns within your SQL query. This ensures that columns are formatted in the same way wherever they are used.

A **format tag** is appended to your column name with an underscore: for example, to append the percentage format to a column named `growth`, it would be `growth_pct`.

Formatting can be configured in the Value Formatting Section of the Evidence Settings.

Format tags are case-insensitive, so `growth_pct` and `GROWTH_PCT` are equivalent.

### Title Formatting

When creating a table, Evidence formats column titles based on the name of the column and its format tag. Format tags that do not add to the meaning of the column name are not printed as part of the title. All columns are printed with proper casing.

#### Examples



```sql title_formats
select 'sales_usd' as column_name, 'Sales ($)' as formatted_title, 0 as row_num union all
select 'customer_id', 'Customer ID', 1 union all
select 'growth_pct', 'Growth', 2 union all
select 'customer_number_num2k', 'Customer Number', 3
order by row_num
```

<DataTable data={title_formats} rows=all>
    <Column id="column_name" />
    <Column id="formatted_title" />
</DataTable>




## Format Function

The format function is used to format expressions within markdown. This is useful when you cannot use a component.

The syntax is:

```javascript
{fmt(expression, formatCode)}
```

`formatCode` can be any one of the following:
- An Excel-style format code (e.g., `$#,##0.0`)
- A built-in Evidence format (e.g., `eur`)
- A custom-defined format code (see section above on custom formats)


### Example

In the below example, we return a value from a calculation. In this situtation we cannot use the `Value` component, which only accepts a single row. Instead we use the `Format` function to format the result.


````markdown
```sql sales_per_year
select
    date_part('year', order_datetime) AS year,
    sum(sales) AS total_sales
from needful_things.orders
group by year
order by year desc
```

Sales are {fmt(sales_per_year[0].total_sales - sales_per_year[1].total_sales, '+#,##0;-#,##0')} vs last year.
````
