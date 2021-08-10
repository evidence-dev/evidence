---
sidebar_position: 2
hide_table_of_contents: false
---

# Unit Formatting

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