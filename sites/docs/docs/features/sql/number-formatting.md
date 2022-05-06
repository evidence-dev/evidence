---
sidebar_position: 3
hide_table_of_contents: false
title: "Number Formatting"
---

Formats are defined using the column names in your SQL query. 

A **format tag** can be appended to your column name to ensure the right format (see table below for accepted tags). 

Format tags are appended with an underscore: for example, to append the percentage format to a column named `growth`, it would be `growth_pct`.

Evidence will also format the column if the column’s name matches any of the accepted format tags exactly (e.g., if your column is named `date`, Evidence will use the `date` format).

## Accepted Tags
Below are the currently accepted format tags and their respective formats. Most numbers are formatted with 2 decimal places. This functionality will be extended in future versions to allow for more customization of formats.

<table>
<tr>
<th>Format Type</th>
<th>Format Tag</th>
<th>Format Name</th> 
<th>Example</th>
</tr>
<tr>
<td>Date</td>
<td>date</td>
<td>Date</td> 
<td>March 17, 2021</td>
</tr>
<tr>
<td>Date</td>
<td>week</td>
<td>Week</td> 
<td>March 14, 2021</td>
</tr>
<tr>
<td>Date</td>
<td>month</td>
<td>Month</td> 
<td>Mar 1, 2021</td>
</tr>
<tr>
<td>Date</td>
<td>qtr</td>
<td>Quarter</td> 
<td>Jan 1, 2021</td>
</tr>
<tr>
<td>Date</td>
<td>year</td>
<td>Year</td> 
<td>1994</td>
</tr>
<tr>
<td>String</td>
<td>id</td>
<td>ID</td> 
<td>355123</td>
</tr>
<tr>
<td>String</td>
<td>str</td>
<td>String</td> 
<td>355123</td>
</tr>
<tr>
<td>Number</td>
<td>pct</td>
<td>Percent</td> 
<td>12%</td>
</tr>
<tr>
<td>Number</td>
<td>usd</td>
<td>Currency (USD)</td> 
<td>$1,053.29</td>
</tr>
<tr>
<td>Number</td>
<td>cad</td>
<td>Currency (CAD)</td> 
<td>$1,053.29</td>
</tr>
<tr>
<td>Number</td>
<td>eur</td>
<td>Currency (EUR)</td> 
<td>€1,053.29</td>
</tr>
<tr>
<td>Number</td>
<td>gbp</td>
<td>Currency (GBP)</td> 
<td>£1,053.29</td>
</tr>
<tr>
<td>Number</td>
<td>chf</td>
<td>Currency (CHF)</td> 
<td>CHF1,053.29</td>
</tr>
</table>


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
<td>Growth (%)</td>
</tr>
<tr>
<td>customer_number_str</td>
<td>Customer Number</td>
</tr>
</table>


## Unit Formatting

In chart and table components, Evidence automatically formats large numbers into shortened versions based on the size of the maximum number in that column. Future versions will allow for more control over how and when units are used.

Below are the thresholds for automatic unit formats. Unit formats are applied when at least 75% of a chart axis is in those large units.

<table>
<tr>
<th>Units</th>
<th>Suffix</th> 
<th>Threshold</th> 
<th>Example</th> 
</tr>
<tr>
<td>Thousands</td>
<td>k</td>
<td>4,000</td>
<td>4k</td>
</tr>
<tr>
<td>Millions</td>
<td>M</td>
<td>4,000,000</td>
<td>4M</td>
</tr>
<tr>
<td>Billions</td>
<td>B</td>
<td>4,000,000,000</td>
<td>4B</td>
</tr>
</table>

Units are combined with format tags. For example, if you had a chart with a maximum y-axis value of **10 million** and your column name included the `_usd` format tag, the value would be formatted as **$10M**