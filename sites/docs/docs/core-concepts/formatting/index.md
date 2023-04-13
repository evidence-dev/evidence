---
sidebar_position: 5
hide_table_of_contents: false
title: 'Number Formatting'
description: 'Formats are defined using the column names in your SQL query'
---

Formats for numbers and dates are defined using the column names in your SQL query.

A **format tag** can be appended to your column name to ensure the right format (see table below for accepted tags).

Format tags are appended with an underscore: for example, to append the percentage format to a column named `growth`, it would be `growth_pct`.

Formatting can be configured in the Value Formatting Section of the Evidence Settings.

Format tags are case-insensitive, so `growth_pct` and `GROWTH_PCT` are equivalent.

## Built-in Value Format Tags

Evidence supports a variety of date/time, number, percentage, and currency formats. You can find the full list of format tags [below](#format-reference)

## Custom Value Format Tags

Custom formats can be added in the Value Formatting Section of the Evidence Settings. Formats can be coded using [Excel style custom format codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68).

## Title Formatting

When creating a table, Evidence formats column titles based on the name of the column and its format tag. Format tags that do not add to the meaning of the column name are not printed as part of the title.

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

## Large Numbers

Evidence automatically formats large numbers into shortened versions based on the size of the median number in a column (e.g., 4,000,000 &rarr; 4M).

You can choose to handle these numbers differently by choosing a specific format code. For example, if Evidence is formatting a column as millions, but you want to see all numbers in thousands, you could use the `num0k` format tag, which will show all numbers in the column in thousands with 0 decimal places.

## Format Reference

<!-- These are pasted in from the settings menu HTML, with edits -->

### Dates

<table class="wide">
<thead >
    <th class="align_left narrow_column">Format Tag</th>
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

### Currencies

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
    <th class="align_left narrow_column">Format Tag</th> 
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

### Numbers

<table>
<thead>
    <th class="align_left narrow_column">Format Tag</th> 
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

### Percentages

<table>
<thead>
    <th class="align_left narrow_column">Format Tag</th> 
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
