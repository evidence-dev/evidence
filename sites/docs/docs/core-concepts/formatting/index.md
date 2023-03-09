---
sidebar_position: 5
hide_table_of_contents: false
title: "Value Formatting"
---

Formats are defined using the column names in your SQL query. 

A **format tag** can be appended to your column name to ensure the right format (see table below for accepted tags). 

Format tags are appended with an underscore: for example, to append the percentage format to a column named `growth`, it would be `growth_pct`.

Formatting can be configured in the Value Formatting Section of the Evidence Settings.

## Built-in Value Format Tags
Evidence supports a variety of date/time, number, percentage, and currency formats. You can find the full list and examples of supported format tags on the Settings page in your Evidence project.

## Custom Value Format Tags
Custom formats can be added in the Value Formatting Section of the Evidence Settings.  Formats can be coded using [Excel style custom format codes](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68).

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