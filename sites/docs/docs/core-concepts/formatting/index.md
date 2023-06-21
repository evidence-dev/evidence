---
sidebar_position: 5
hide_table_of_contents: false
title: 'Value Formatting'
description: 'Number and date formatting options in Evidence'
---

The easiest way to format numbers and dates in Evidence is through component props. You can pass in any of the following:
- Excel-style format codes
- Evidence's [built-in formats](#built-in-formats)
- [Custom formats](#custom-formats)

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

:::info Date formatting
Formatting does not apply to the date axis of a chart. For example, if you set `xFmt` to `m/d/yy`, you will only see that formatting reflected in your chart tooltips and annotations. This is to ensure that the chart axis labels have the correct spacing.
:::


#### Reusable Formats
For a more reusable approach, you can use [SQL format tags](#sql-format-tags), which let you define formats within your SQL. This guarantees that your columns will be formatted in the same way wherever they are used in Evidence.

You can also create your own [custom formats](#custom-formats), which are format codes you can reuse across your project.

#### Formatting Directly in Markdown
If you need to format values outside of components, [the format function](#format-function) can be used directly. For example, when using [expressions](/core-concepts/syntax#expressions) it is not possible to use component props or format tags.

## Supported Formats

### Excel Format Codes
Evidence supports [Excel style custom format codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68), which can be passed directly to a component prop, the [format function](#format-function), or saved as a [custom format code](#custom-formats) that you want to reuse.

:::info Including strings inside formats
To include a string inside an Excel-style format code, you need to use double-quotes to surround the string, and single-quotes to surround the format code. For example, in a chart you might use `yFmt = '#,##0.00 "mpg"'`
:::

### Built-in Formats
Evidence supports a variety of date/time, number, percentage, and currency formats. You can find the full list of formats below.

<!-- These are pasted in from the settings menu HTML, with edits -->

#### Auto-Formatting

Wherever you see `auto` listed beside a format, that means Evidence will automatically format your value based on the context it is in.

For example, Evidence automatically formats large numbers into shortened versions based on the size of the median number in a column (e.g., 4,000,000 &rarr; 4M).

You can choose to handle these numbers differently by choosing a specific format code. For example, if Evidence is formatting a column as millions, but you want to see all numbers in thousands, you could use the `num0k` format, which will show all numbers in the column in thousands with 0 decimal places.

#### Dates

<table class="wide">
<thead >
    <th class="align_left narrow_column">Format Name</th>
    <th class="align_left wide_column">Format Code</th>
    <th class="align_left wide_column">Example Input</th>
    <th class="tright wide_column">Example Output</th>
</thead>

<tr >
    <td >ddd</td> 
    <td >ddd</td> 
    <td >2022-01-09 12:45</td> 
    <td class="tright">Sun</td>
</tr>
<tr >
    <td >dddd</td>
    <td >dddd</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">Sunday</td>
</tr>
<tr >
    <td >mmm</td>
    <td >mmm</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">Jan</td>
</tr>
<tr >
    <td >mmmm</td>
    <td >mmmm</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">January</td>
</tr>
<tr >
    <td >yyyy</td>
    <td >yyyy</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">2022</td>
</tr>
<tr >
    <td >shortdate</td>
    <td >mmm d/yy</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">Jan 9/22</td>
</tr>
<tr >
    <td >longdate</td>
    <td >mmmm d, yyyy</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">January 9, 2022</td>
</tr>
<tr >
    <td >fulldate</td>
    <td >dddd mmmm d, yyyy</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">Sunday January 9, 2022</td>
</tr>
<tr >
    <td >mdy</td>
    <td >m/d/y</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">1/9/22</td>
</tr>
<tr >
    <td >dmy</td>
    <td >d/m/y</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">9/1/22</td>
</tr>
<tr >
    <td >hms</td>
    <td >H:MM:SS AM/PM</td>
    <td >2022-01-09 12:45</td>
    <td class="tright">11:45:03 AM</td>
</tr>
</table >

#### Currencies

Supported currencies:

<table>
  <thead><th>Code</th><th>Currency</th></thead>
  <tr><td>USD</td><td>United States Dollar</td></tr>
  <tr><td>AUD</td><td>Australian Dollar</td></tr>
  <tr><td>BRL</td><td>Brazilian Real</td></tr>
  <tr><td>CAD</td><td>Canadian Dollar</td></tr>
  <tr><td>CNY</td><td>Renminbi</td></tr>
  <tr><td>EUR</td><td>Euro</td></tr>
  <tr><td>GBP</td><td>Pound Sterling</td></tr>
  <tr><td>JPY</td><td>Japanese Yen</td></tr>
  <tr><td>INR</td><td>Indian Rupee</td></tr>
  <tr><td>KRW</td><td>South Korean won</td></tr>
  <tr><td>NGN</td><td>Nigerian Naira</td></tr>
  <tr><td>RUB</td><td>Russian Ruble</td></tr>
  <tr><td>SEK</td><td>Swedish Krona</td></tr>
</table>

In order to use currency tags, use the currency code, optionally appended with:

- a number indicating the number of decimal places to show (0-2)
- a letter indication the order of magnitude to show ("","k", "m", "b")

For example, the available tags for USD are:

<table>
<thead>
    <th class="align_left narrow_column">Format Name</th> 
    <th class="align_left wide_column">Format Code</th> 
    <th class="align_left wide_column">Example Input</th> 
    <th class="tright wide_column">Example Output</th>
</thead> 
<tr>
    <td>usd</td> 
    <td>auto</td> 
    <td class="tright">412.17</td> 
    <td class="tright">$412</td> 
</tr>
<tr>
    <td>usd0</td> 
    <td>$#,##0</td> 
    <td class="tright">7043.123</td> 
    <td class="tright">$7,043</td> 
</tr>
<tr>
    <td>usd1</td> 
    <td>$#,##0.0</td> 
    <td class="tright">7043.123</td> 
    <td class="tright">$7,043.1</td> 
</tr>
<tr>
    <td>usd2</td> 
    <td>$#,##0.00</td> 
    <td class="tright">7043.123</td> 
    <td class="tright">$7,043.12</td> 
</tr>
<tr>
    <td>usd0k</td> 
    <td>$#,##0,"k"</td> 
    <td class="tright">64301.12</td> 
    <td class="tright">$64k</td> 
</tr>
<tr>
    <td>usd1k</td> 
    <td>$#,##0.0,"k"</td> 
    <td class="tright">64301.12</td> 
    <td class="tright">$64.3k</td> 
</tr>
<tr>
    <td>usd2k</td> 
    <td>$#,##0.00,"k"</td> 
    <td class="tright">64301.12</td> 
    <td class="tright">$64.30k</td> 
</tr>
<tr>
    <td>usd0m</td> 
    <td>$#,##0,,"M"</td> 
    <td class="tright">4564301.12</td> 
    <td class="tright">$5M</td> 
</tr>
<tr>
    <td>usd1m</td> 
    <td>$#,##0.0,,"M"</td> 
    <td class="tright">4564301.12</td> 
    <td class="tright">$4.6M</td> 
</tr>
<tr>
    <td>usd2m</td> 
    <td>$#,##0.00,,"M"</td> 
    <td class="tright">4564301.12</td> 
    <td class="tright">$4.56M</td> 
</tr>
<tr>
    <td>usd0b</td> 
    <td>$#,##0,,,"B"</td> 
    <td class="tright">9784564301.12</td> 
    <td class="tright">$10B</td> 
</tr>
<tr>
    <td>usd1b</td> 
    <td>$#,##0.0,,,"B"</td> 
    <td class="tright">9784564301.12</td> 
    <td class="tright">$9.8B</td> 
</tr>
<tr>
    <td>usd2b</td> 
    <td>$#,##0.00,,,"B"</td> 
    <td class="tright">9784564301.12</td> 
    <td class="tright">$9.78B</td>

</tr>

</table>

#### Numbers

<table>
<thead>
    <th class="align_left narrow_column">Format Name</th> 
    <th class="align_left wide_column">Format Code</th> 
    <th class="align_left wide_column">Example Input</th> 
    <th class="tright wide_column">Example Output</th>
</thead> 
<tr>
    <td>num0</td> 
    <td>#,##0</td> 
    <td class="tright">11.23168</td> 
    <td class="tright">11</td> 
</tr>
<tr>
    <td>num1</td> 
    <td>#,##0.0</td> 
    <td class="tright">11.23168</td> 
    <td class="tright">11.2</td> 
</tr>
<tr>
    <td>num2</td> 
    <td>#,##0.00</td> 
    <td class="tright">11.23168</td> 
    <td class="tright">11.23</td> 
</tr>
<tr>
    <td>num3</td> 
    <td>#,##0.000</td> 
    <td class="tright">11.23168</td> 
    <td class="tright">11.232</td> 
</tr>
<tr>
    <td>num4</td> 
    <td>#,##0.0000</td> 
    <td class="tright">11.23168</td> 
    <td class="tright">11.2317</td> 
</tr>
<tr>
    <td>num0k</td> 
    <td>#,##0,"k"</td> 
    <td class="tright">64201</td> 
    <td class="tright">64k</td> 
</tr>
<tr>
    <td>num1k</td> 
    <td>#,##0.0,"k"</td> 
    <td class="tright">64201</td> 
    <td class="tright">64.2k</td> 
</tr>
<tr>
    <td>num2k</td> 
    <td>#,##0.00,"k"</td> 
    <td class="tright">64201</td> 
    <td class="tright">64.20k</td> 
</tr>
<tr>
    <td>num0m</td> 
    <td>#,##0,,"M"</td> 
    <td class="tright">42539483</td> 
    <td class="tright">43M</td> 
</tr>
<tr>
    <td>num1m</td> 
    <td>#,##0.0,,"M"</td> 
    <td class="tright">42539483</td> 
    <td class="tright">42.5M</td> 
</tr>
<tr>
    <td>num2m</td> 
    <td>#,##0.00,,"M"</td> 
    <td class="tright">42539483</td> 
    <td class="tright">42.54M</td> 
</tr>
<tr>
    <td>num0b</td> 
    <td>#,##0,,,"B"</td> 
    <td class="tright">1384937584</td> 
    <td class="tright">1B</td> 
</tr>
<tr>
    <td>num1b</td> 
    <td>#,##0.0,,,"B"</td> 
    <td class="tright">1384937584</td> 
    <td class="tright">1.4B</td> 
</tr>
<tr>
    <td>num2b</td> 
    <td>#,##0.00,,,"B"</td> 
    <td class="tright">1384937584</td> 
    <td class="tright">1.38B</td> 
</tr>
<tr>
    <td>id</td> 
    <td>0</td> 
    <td class="tright">921594675</td> 
    <td class="tright">921594675</td> 
</tr>
<tr>
    <td>fract</td> 
    <td># ?/?</td> 
    <td class="tright">0.25</td> 
    <td class="tright"> 1/4</td> 
</tr>
<tr>
    <td>mult</td> 
    <td>#,##0.0"x"</td> 
    <td class="tright">5.32</td> 
    <td class="tright">5.3x</td> 
</tr>
<tr>
    <td>mult0</td> 
    <td>#,##0"x"</td> 
    <td class="tright">5.32</td> 
    <td class="tright">5x</td> 
</tr>
<tr>
    <td>mult1</td> 
    <td>#,##0.0"x"</td> 
    <td class="tright">5.32</td> 
    <td class="tright">5.3x</td> 
</tr>
<tr>
    <td>mult2</td> 
    <td>#,##0.00"x"</td> 
    <td class="tright">5.32</td> 
    <td class="tright">5.32x</td> 
</tr>
<tr>
    <td>sci</td> 
    <td>0.00E+0</td> 
    <td class="tright">16546.1561</td> 
    <td class="tright">1.65E+4</td>

</tr>

</table>

#### Percentages

<table>
<thead>
    <th class="align_left narrow_column">Format Name</th> 
    <th class="align_left wide_column">Format Code</th> 
    <th class="align_left wide_column">Example Input</th> 
    <th class="tright wide_column">Example Output</th>
</thead> 
<tr>
    <td>pct</td> 
    <td>auto</td> 
    <td class="tright">0.731</td> 
    <td class="tright">73.1%</td> 
</tr>
<tr>
    <td>pct0</td> 
    <td>#,##0%</td> 
    <td class="tright">0.731</td> 
    <td class="tright">73%</td> 
</tr>
<tr>
    <td>pct1</td> 
    <td>#,##0.0%</td> 
    <td class="tright">0.731</td> 
    <td class="tright">73.1%</td> 
</tr>
<tr>
    <td>pct2</td> 
    <td>#,##0.00%</td> 
    <td class="tright">0.731</td> 
    <td class="tright">73.10%</td> 
</tr>
<tr>
    <td>pct3</td> 
    <td>#,##0.000%</td> 
    <td class="tright">0.731</td> 
    <td class="tright">73.100%</td>

</tr>

</table>


### Custom Formats

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

<table>
<tr>
<th>Column Name</th>
<th>Formatted Title</th>
</tr>
<tr>
<td>sales_usd</td>
<td>Sales ($)</td>
</tr>
<tr>
<td>customer_id</td>
<td>Customer ID</td>
</tr>
<tr>
<td>growth_pct</td>
<td>Growth</td>
</tr>
<tr>
<td>customer_number_num2k</td>
<td>Customer Number</td>
</tr>
</table>


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
from orders
group by year
order by year desc
```

Sales are {fmt(sales_per_year[0].total_sales - sales_per_year[1].total_sales, '+#,##0;-#,##0')} vs last year.
````
