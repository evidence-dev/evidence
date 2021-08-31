---
sidebar_position: 3
hide_title: true
hide_table_of_contents: false
---

# LineChart
<h1 class="community-header"><span class="gradient">&lt;LineChart/></span></h1>

![line-chart](/img/line-chart.png)

```markdown
<LineChart 
    data={data.query_name}  
    x=column_x 
    y=column_y
/>
```
### Required Props
* **data** - query name, referenced as a subset of Evidence's **`data`** object
* **x** - column to use for the x-axis of the chart, name without quotes
* **y** - column to use for the y-axis of the chart, name without quotes

### Optional Props
* **series** - colunn to use as the series (groups) in a multi-series chart
* **legend** - turn legend off or on. Default is `legend=top`; to turn off, change to `legend=none`

### Labeling Props
* **units** - adds a label to the top of the y-axis, to the right of the top value on the axis
* **xAxisTitle** - adds a title to the x-axis at the bottom right of the chart. This can also serve as a footnote location

### Formatting Props
* **yMin** - value to start the y-axis at. Default is 0
* **xGridlines** - turn x-axis gridlines on or off. Default is off. Turn on with `xGridlines=true`
* **yGridlines** - turn y-axis gridlines on or off. Default is on. Turn off with `yGridlines=false`
* **lineLabel** - direct label for a single line chart. Label appears just to the right of the last point in the line
* **lineColor** - CSS color input (color name, hexadecimal code, or RGB code)
* **lineWidth** - pixel width of line (number). Default = 1.5
* **lineTransparency** - % of color which will be rendered as transparent (value between 0 and 1)
* **lineDashSize** - determines distance between dashes. Default is 0. Turn dashes on with any value above 0

:::note
Evidence's component tags need to be closed using `/>` (same as HTML tags)
:::

### Plotting Multiple Lines
At the moment, the only way to plot multiple lines is to have your data in **tidy** format, which means having one column containing the "series" (or "group") for each data point.

**Tidy Data Example:**
<table>
<tr>
<th>year</th>
<th>units</th>
<th>series</th> 
</tr>
<tr>
<td>2015</td>
<td>154</td>
<td>apples</td> 
</tr>
<tr>
<td>2016</td>
<td>178</td>
<td>apples</td> 
</tr>
<tr>
<td>2017</td>
<td>182</td>
<td>apples</td> 
</tr>
<tr>
<td>2015</td>
<td>228</td>
<td>oranges</td> 
</tr>
<tr>
<td>2016</td>
<td>218</td>
<td>oranges</td> 
</tr>
<tr>
<td>2017</td>
<td>214</td>
<td>oranges</td> 
</tr>
</table>

**Non-Tidy Data Example:**

If you only have data in non-tidy format, you may have multiple columns that you'd like to plot - each representing a different measure. Using the same example data above, non-tidy data would look like this:

<table>
<tr>
<th>year</th>
<th>apples</th> 
<th>oranges</th> 
</tr>
<tr>
<td>2015</td>
<td>154</td>
<td>228</td> 
</tr>
<tr>
<td>2016</td>
<td>178</td>
<td>218</td> 
</tr>
<tr>
<td>2017</td>
<td>182</td>
<td>214</td> 
</tr>
</table>

:::tip Improvements in future releases
In a future release, we are going to make it easy to plot multiple columns from a non-tidy dataset. For now, a workaround in your SQL query is required.
:::

We recommend using `UNPIVOT` in SQL to get your data into a tidy format. This should work in BigQuery and Snowflake. For Postgres, check out [this Stackoverflow post](https://stackoverflow.com/questions/64268037/unpivot-table-in-postgresql) for possible solutions until Evidence supports multiple line arguments.

**Pivot Example**

Using the data from the examples above, here is what the original query might have been for the non-tidy dataset:

```SQL
SELECT year, apples, oranges
FROM fruit_units
```

Below is an UNPIVOT operation, which takes the columns specified in the parentheses at the end of the query (apples, oranges), uses each column name as a string in a new column called fruit, and uses the values from those columns in a new column called units:

```SQL
WITH fruits AS
(
    SELECT year, apples, oranges
    FROM fruit_units
)

SELECT * FROM fruits
UNPIVOT(units for fruit IN (apples, oranges))
```

**Further Documentation on UNPIVOT:**
* BigQuery: https://cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax#unpivot_operator
* Snowflake: https://docs.snowflake.com/en/sql-reference/constructs/unpivot.html
