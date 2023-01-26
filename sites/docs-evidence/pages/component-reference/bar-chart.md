<script>
    import { showQueries } from '@evidence-dev/components/ui/stores'
	showQueries.set(false)
</script>

# Bar Chart
```orders_by_year
select 
date_part('year', order_datetime::timestamp)::string as year,
sum(sales) as sales_usd
from orders
group by 1
order by 1
```

```orders_by_category
select 
category,
sum(sales) as sales_usd
from orders
group by 1
order by 2 desc
```


```orders_by_year_and_category
select 
date_part('year', order_datetime::timestamp)::string as year,
category,
sum(sales) as sales_usd
from orders
group by 1,2
order by 1,3 desc
```

```orders_by_item
select 
item,
sum(sales) as sales_usd
from orders
group by 1
order by 2 desc
```



## Bar

<BarChart 
    data={orders_by_year} 
    x=year
    y=sales_usd
    title="Sales by Year"
/>

```svelte
<BarChart 
    data={orders_by_year} 
    x=year
    y=sales_usd
    title="Sales by Year"
/>
```
---
## Horizontal Bar

<BarChart 
    data={orders_by_category} 
    x=category
    y=sales_usd
    title="Sales by Category"
    swapXY=true
/>

```svelte
<BarChart 
    data={orders_by_category} 
    x=category
    y=sales_usd
    title="Sales by Category"
    swapXY=true
/>
```
---
## Stacked Bar

<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    title="Sales by Year and Category"
/>

```svelte
<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    title="Sales by Year and Category"
/>
```

---
## 100% Stacked Bar

<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    title="Sales by Year and Category"
    type=stacked100
/>

```svelte
<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    type=stacked100
    title="Sales by Year and Category"
/>
```
--- 

## Horizontal Stacked Bar

<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    swapXY=true
    title="Sales by Year and Category"
    
/>

```svelte
<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    swapXY=true
    title="Sales by Year and Category"
/>
```

---

## Horizontal 100% Stacked Bar

<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    swapXY=true
    type=stacked100
    title="Sales by Year and Category"
/>  

```svelte
<BarChart
    data={orders_by_year_and_category}
    x=year
    y=sales_usd
    series=category
    swapXY=true
    type=stacked100
    title="Sales by Year and Category"
/>
```

---
## Grouped Bar

<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    type=grouped
    title="Sales by Year and Category"
/>

```svelte
<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    type=grouped
    title="Sales by Year and Category"
/>
```

---
## Horizontal Grouped Bar

<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    type=grouped
    swapXY=true
    title="Sales by Year and Category"
    
/>

```svelte
<BarChart 
    data={orders_by_year_and_category} 
    x=year
    y=sales_usd
    series=category
    type=grouped
    swapXY=true
    title="Sales by Year and Category"
/>
```

---
## Long Bar Chart
If you create a bar chart with many x-axis items (e.g., names of departments), Evidence will extend the height of the chart for you to avoid the bars becoming squished. See Long Bar example below.

<BarChart 
    data={orders_by_item} 
    x=item
    y=sales_usd
    title="Sales by Item"
    swapXY=true
/>

```svelte
<BarChart 
    data={orders_by_item} 
    x=item
    y=sales_usd
    title="Sales by Item"
    swapXY=true
/>
```

# Props

## Data
<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>x</td>	<td>Column to use for the x-axis of the chart</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>First column</td>	</tr>
<tr>	<td>y</td>	<td>Column(s) to use for the y-axis of the chart</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name | array of column names</td>	<td class='tcenter'>Any non-assigned numeric columns</td>	</tr>
<tr>	<td>sort</td>	<td>Whether to apply default sort to your data. Default sort is x ascending for number and date x-axes, and y descending for category x-axes</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false </td>	</tr>
<tr>	<td>series</td>	<td>Column to use as the series (groups) in a multi-series chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
</table>																																																	

## Series
<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>type</td>	<td>Grouping method to use for multi-series charts</td>	<td class='tcenter'>-</td>	<td class='tcenter'>stacked | grouped | stacked100</td>	<td class='tcenter'>stacked</td>	</tr>
<tr>	<td>stackName</td>	<td>Name for an individual stack. If separate Bar components are used with different stackNames, the chart will show multiple stacks</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillColor</td>	<td>Color to override default series color. Only accepts a single color.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>fillOpacity</td>	<td>% of the full color that should be rendered, with remainder being transparent</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number (0 to 1)</td>	<td class='tcenter'>1</td>	</tr>
<tr>	<td>outlineWidth</td>	<td>Width of line surrounding each bar</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>0</td>	</tr>
<tr>	<td>outlineColor</td>	<td>Color to use for outline if outlineWidth > 0</td>	<td class='tcenter'>-</td>	<td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	<td class='tcenter'>-</td>	</tr>
</table>											

## Chart
<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>swapXY</td>	<td>Swap the x and y axes to create a horizontal chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>title</td>	<td>Chart title. Appears at top left of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>subtitle</td>	<td>Chart subtitle. Appears just under title.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>legend</td>	<td>Turns legend on or off. Legend appears at top center of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true for multiple series</td>	</tr>
<tr>	<td>xAxisTitle</td>	<td>Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | string | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yAxisTitle</td>	<td>Name to show beside y-axis. If 'true', formatted column name is used.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | string | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xGridlines</td>	<td>Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yGridlines</td>	<td>Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>xAxisLabels</td>	<td>Turns on/off value labels on the x-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>yAxisLabels</td>	<td>Turns on/off value labels on the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>xBaseline</td>	<td>Turns on/off thick axis line (line appears at y=0)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>yBaseline</td>	<td>Turns on/off thick axis line (line appears directly alongside the y-axis labels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xTickMarks</td>	<td>Turns on/off tick marks for each of the x-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yTickMarks</td>	<td>Turns on/off tick marks for each of the y-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yMin</td>	<td>Starting value for the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yMax</td>	<td>Maximum value for the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
</table>												
