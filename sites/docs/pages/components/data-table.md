---
title: Data Table
sidebar_position: 1
---

## Examples

### Displaying All Columns in Query

```orders_summary
select * from needful_things.orders
limit 100
```

```html
<DataTable data={orders_summary}/>
```

<DataTable data={orders_summary}/>

### Selecting Specific Columns

```html
<DataTable data={orders_summary}> 
    <Column id=state title="Sales State"/> 
	<Column id=item/> 
	<Column id=category/> 
	<Column id=sales fmt=usd/> 
	<Column id=channel/> 
</DataTable>
```

<DataTable data={orders_summary}> 
    <Column id=state title="Sales State"/> 
	<Column id=item/> 
	<Column id=category/> 
	<Column id=sales fmt=usd/> 
	<Column id=channel/> 
</DataTable>

### Search

```html
<DataTable data={orders_summary} search=true/>
```

<DataTable data={orders_summary} search=true/>

### Deltas

```sql country_summary
select date '2020-04-30' as date, 87 as value_usd, 0.0234 as yoy, 'Austria' as country, 'B' as category, 100384 as country_id, 'AT' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/AT.png' as flag, 'https://www.google.ca/search?q=austria' as country_url
union all
select date '2020-05-01' as date, 95 as value_usd, 0.0534 as yoy, 'Australia' as country, 'C' as category, 104942 as country_id, 'AU' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/AU.png' as flag, 'https://www.google.ca/search?q=australia' as country_url
union all
select date '2020-05-02' as date, 163 as value_usd, 0.0264 as yoy, 'Brazil' as country, 'A' as category, 100842 as country_id, 'BR' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/BR.png' as flag, 'https://www.google.ca/search?q=brazil' as country_url
union all
select date '2020-05-03' as date, 174 as value_usd, 0.0727 as yoy, 'Canada' as country, 'A' as category, 104975 as country_id, 'CA' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/CA.png' as flag, 'https://www.google.ca/search?q=canada' as country_url
union all
select date '2020-05-04' as date, 214 as value_usd, -0.1223 as yoy, 'Chile' as country, 'B' as category, 100644 as country_id, 'CL' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/CL.png' as flag, 'https://www.google.ca/search?q=chile' as country_url
union all
select date '2020-05-05' as date, 342 as value_usd, 0.0124 as yoy, 'Denmark' as country, 'B' as category, 102948 as country_id, 'DK' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/DK.png' as flag, 'https://www.google.ca/search?q=denmark' as country_url
union all
select date '2020-05-06' as date, 331 as value_usd, 0.0252 as yoy, 'Estonia' as country, 'D' as category, 102495 as country_id, 'EE' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/EE.png' as flag, 'https://www.google.ca/search?q=estonia' as country_url
union all
select date '2020-05-07' as date, 98 as value_usd, 0.0754 as yoy, 'Finland' as country, 'B' as category, 104962 as country_id, 'FI' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/FI.png' as flag, 'https://www.google.ca/search?q=finland' as country_url
union all
select date '2020-05-08' as date, 128 as value_usd, -0.0246 as yoy, 'Ghana' as country, 'C' as category, 100599 as country_id, 'GH' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/GH.png' as flag, 'https://www.google.ca/search?q=ghana' as country_url
union all
select date '2020-05-09' as date, 153 as value_usd, 0.0447 as yoy, 'Honduras' as country, 'D' as category, 102494 as country_id, 'HN' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/HN.png' as flag, 'https://www.google.ca/search?q=honduras' as country_url
union all
select date '2020-05-10' as date, 384 as value_usd, -0.0255 as yoy, 'India' as country, 'A' as category, 101948 as country_id, 'IN' as country_code,  'https://flaglog.com/codes/standardized-rectangle-120px/IN.png' as flag, 'https://www.google.ca/search?q=india' as country_url
union all
select date '2020-05-11' as date, 234 as value_usd, 0.0855 as yoy, 'Ireland' as country, 'B' as category, 100987 as country_id, 'IE' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/IE.png' as flag, 'https://www.google.ca/search?q=ireland' as country_url
union all
select date '2020-05-12' as date, 67 as value_usd, 0.0635 as yoy, 'Jamaica' as country, 'C' as category, 101248 as country_id, 'JM' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/JM.png' as flag, 'https://www.google.ca/search?q=jamaica' as country_url
union all
select date '2020-05-13' as date, 125 as value_usd, -0.0232 as yoy, 'Kenya' as country, 'C' as category, 101947 as country_id, 'KE' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/KE.png' as flag, 'https://www.google.ca/search?q=kenya' as country_url
union all
select date '2020-05-14' as date, 118 as value_usd, -0.0343 as yoy, 'Lebanon' as country, 'D' as category, 108849 as country_id, 'LB' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/LB.png' as flag, 'https://www.google.ca/search?q=lebanon' as country_url
union all
select date '2020-05-15' as date, 263 as value_usd, 0.0883 as yoy, 'Mexico' as country, 'B' as category, 100763 as country_id, 'MX' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/MX.png' as flag, 'https://www.google.ca/search?q=mexico' as country_url
union all
select date '2020-05-16' as date, 211 as value_usd, 0.0395 as yoy, 'Nigeria' as country, 'A' as category, 100837 as country_id, 'NG' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/NG.png' as flag, 'https://www.google.ca/search?q=nigeria' as country_url
union all
select date '2020-05-17' as date, 192 as value_usd, 0.0234 as yoy, 'Oman' as country, 'D' as category, 100993 as country_id, 'OM' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/OM.png' as flag, 'https://www.google.ca/search?q=oman' as country_url
union all
select date '2020-05-18' as date, 59 as value_usd, 0.0828 as yoy, 'Philippines' as country, 'D' as category, 104128 as country_id, 'PH' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/PH.png' as flag, 'https://www.google.ca/search?q=philippines' as country_url
union all
select date '2020-05-19' as date, 113 as value_usd, 0.0554 as yoy, 'Qatar' as country, 'C' as category, 100181 as country_id, 'QA' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/QA.png' as flag, 'https://www.google.ca/search?q=qatar' as country_url
union all
select date '2020-05-20' as date, 190 as value_usd, 0.0134 as yoy, 'Romania' as country, 'A' as category, 101384 as country_id, 'RO' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/RO.png' as flag, 'https://www.google.ca/search?q=romania ! startups' as country_url
union all
select date '2020-05-21' as date, 190 as value_usd, -0.0554 as yoy, 'Sweden' as country, 'B' as category, 101847 as country_id, 'SE' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/SE.png' as flag, 'https://www.google.ca/search?q=sweden' as country_url
union all
select date '2020-05-22' as date, 248 as value_usd, 0.0254 as yoy, 'Thailand' as country, 'C' as category, 104837 as country_id, 'TH' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/TH.png' as flag, 'https://www.google.ca/search?q=thailand' as country_url
union all
select date '2020-05-23' as date, 168 as value_usd, 0.0294 as yoy, 'Ukraine' as country, 'C' as category, 101938 as country_id, 'UA' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/UA.png' as flag, 'https://www.google.ca/search?q=ukraine' as country_url
union all
select date '2020-05-24' as date, 101 as value_usd, 0.0234 as yoy, 'Vietnam' as country, 'A' as category, 104948 as country_id, 'VN' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/VN.png' as flag, 'https://www.google.ca/search?q=vietnam' as country_url
union all
select date '2020-05-25' as date, 67 as value_usd, 0.0294 as yoy, 'Yemen' as country, 'B' as category, 100774 as country_id, 'YE' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/YE.png' as flag, 'https://www.google.ca/search?q=yemen' as country_url
union all
select date '2020-05-26' as date, 100 as value_usd, 0.011 as yoy, 'Zimbabwe' as country, 'A' as category, 100337 as country_id, 'ZW' as country_code, 'https://flaglog.com/codes/standardized-rectangle-120px/ZW.png' as flag, 'https://www.google.ca/search?q=zimbabwe' as country_url
```


```html
<DataTable data={country_summary}>
	<Column id=country />
	<Column id=category />
	<Column id=value_usd />
    <Column id=yoy contentType=delta fmt=pct title="Y/Y Chg"/>
</DataTable>
```

<DataTable data={country_summary}>
	<Column id=country />
	<Column id=category />
	<Column id=value_usd />
    <Column id=yoy contentType=delta fmt=pct title="Y/Y Chg"/>
</DataTable>


### Total Row

Default total aggregation is `sum`

```html
<DataTable data={country_example} totalRow=true rows=5>
  <Column id=country/>
  <Column id=gdp_usd/>
  <Column id=gdp_growth fmt='pct2'/>
  <Column id=population fmt='#,##0"M"'/>
</DataTable>
```

<DataTable data={country_example} totalRow=true rows=5>
  <Column id=country/>
  <Column id=gdp_usd/>
  <Column id=gdp_growth fmt='pct2'/>
  <Column id=population fmt='#,##0"M"'/>
</DataTable>


#### Using Built-in Aggregation Functions

```country_example
select * from ${countries}
limit 5
```

```html
<DataTable data={country_example} totalRow=true rows=5>
  <Column id=country/>
  <Column id=gdp_usd totalAgg=sum/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct2'/>
  <Column id=population totalAgg=mean fmt='#,##0"M"'/>
</DataTable>
```

<DataTable data={country_example} totalRow=true rows=5>
  <Column id=country/>
  <Column id=gdp_usd totalAgg=sum/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct2'/>
  <Column id=population totalAgg=mean fmt='#,##0"M"'/>
</DataTable>

#### Custom Aggregations Values

```html
<DataTable data={countries} totalRow=true rows=5>
  <Column id=country totalAgg="Just the USA"/>
  <Column id=gdp_usd totalAgg={countries[0].gdp_usd} totalFmt=usd/>
</DataTable>
```

<DataTable data={country_example} totalRow=true rows=5>
  <Column id=country totalAgg="Just the USA"/>
  <Column id=gdp_usd totalAgg={countries[0].gdp_usd} totalFmt=usd/>
</DataTable>

#### Custom Total Formats

```html
<DataTable data={countries} totalRow=true rows=5>
  <Column id=country totalAgg="All Countries"/>
  <Column id=continent totalAgg=countDistinct totalFmt='# "Unique continents"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"'/>
  <Column id=gdp_growth totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=interest_rate totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=inflation_rate totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=jobless_rate totalAgg=mean fmt='pct0'/>
  <Column id=gov_budget totalAgg=mean fmt='0.0"%"'/>
  <Column id=debt_to_gdp totalAgg=mean fmt='0"%"'/>
  <Column id=current_account totalAgg=mean fmt='0.0"%"'/>
  <Column id=population totalAgg=sum fmt='#,##0"M"'/>
</DataTable>
```

<DataTable data={country_example} totalRow=true rows=5>
  <Column id=country totalAgg="All Countries"/>
  <Column id=continent totalAgg=countDistinct totalFmt='# "Unique continents"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"'/>
  <Column id=gdp_growth totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=interest_rate totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=inflation_rate totalAgg=mean fmt='pct2' totalFmt='pct1'/>
  <Column id=jobless_rate totalAgg=mean fmt='pct0'/>
  <Column id=gov_budget totalAgg=mean fmt='0.0"%"'/>
  <Column id=debt_to_gdp totalAgg=mean fmt='0"%"'/>
  <Column id=current_account totalAgg=mean fmt='0.0"%"'/>
  <Column id=population totalAgg=sum fmt='#,##0"M"'/>
</DataTable>

### Conditional Formatting

#### Default (`scaleColor=green`)

```html
<DataTable data={countries}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale/>
</DataTable>
```

<DataTable data={country_summary}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale/>
</DataTable>

#### `scaleColor=red`

```html
<DataTable data={countries}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale scaleColor=red/>
</DataTable>
```

<DataTable data={country_summary}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale scaleColor=red/>
</DataTable>

#### `scaleColor=blue`

```html
<DataTable data={countries}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale scaleColor=blue/>
</DataTable>
```

<DataTable data={country_summary}>
    <Column id=country />
    <Column id=country_id align=center/>
    <Column id=category align=center/>
    <Column id=value_usd contentType=colorscale scaleColor=blue/>
</DataTable>

#### Custom Colors

When you pass a custom color to `scaleColor`, Evidence will create a color palette for you, starting at white and ending at the color you provided. See examples further down the page to see how to specify a custom color palette with multiple colors.

```html
<DataTable data={orders_by_category} rowNumbers=true>
  <Column id=month/>
  <Column id=category/>
  <Column id=sales_usd0k contentType=colorscale scaleColor=#a85ab8 align=center/>
  <Column id=num_orders_num0 contentType=colorscale scaleColor=#e3af05 align=center/>
  <Column id=aov_usd2 contentType=colorscale scaleColor=#c43957 align=center/>
</DataTable>
```

```orders_by_category
select order_month as month, category, sum(sales) as sales_usd0k, count(1) as num_orders_num0,
sum(sales) / count(1) as aov_usd2
from needful_things.orders
group by all
```

<DataTable data={orders_by_category} rowNumbers=true>
  <Column id=month/>
  <Column id=category/>
  <Column id=sales_usd0k contentType=colorscale scaleColor=#a85ab8 align=center/>
  <Column id=num_orders_num0 contentType=colorscale scaleColor=#e3af05 align=center/>
  <Column id=aov_usd2 contentType=colorscale scaleColor=#c43957 align=center/>
</DataTable>

### Custom Color Palettes

```numbers
 select 'A' as name, 1 as number
 union all
 select 'B',2
union all
 select 'C',3
 union all
 select 'D',4
 union all
 select 'E',5
 union all
 select 'F',6
 union all
 select 'G',7
 union all
 select 'H',8
 union all
 select 'I',9
 union all
 select 'J',10
 order by number asc
 ```

#### Diverging Scale

```html
<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#6db678','white','#ce5050']}/>
</DataTable>
```

<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#6db678','white','#ce5050']}/>
</DataTable>

#### Heatmap
```html
<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#6db678','#ebbb38','#ce5050']}/>
</DataTable>
```

<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#6db678','#ebbb38','#ce5050']}/>
</DataTable>


#### Color Breakpoints
Use `colorBreakpoints` or `colorMid`/`colorMin`/`colorMax` to control which values are assigned to which sections of the color scale

```html
<DataTable data={negatives} rows=all>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#ce5050','white','#6db678']} colorMid=0/>
</DataTable>
```

<DataTable data={negatives} rows=all>
  <Column id=name/>
  <Column id=number contentType=colorscale scaleColor={['#ce5050','white','#6db678']} colorMid=0/>
</DataTable>

### Red Negatives

```negatives
select 'A' as name, -5 as number,0 as status
union all
select 'B', -4 as number, 1 as status
union all
select 'C', -3 as number, 2 as status
union all
select 'D', -2 as number,0
union all
select 'E', -1 as number,1
union all
select 'F', 0 as number,1
union all
select 'G', 1 as number,2
union all
select 'H', 2 as number,2
union all
select 'I', 3 as number,0
union all
select 'J', 4 as number,0
order by number asc
```

```html
<DataTable data={negatives}>
  <Column id=name/>
  <Column id=number redNegatives=true/>
</DataTable>
```

<DataTable data={negatives}>
  <Column id=name/>
  <Column id=number redNegatives=true/>
</DataTable>


### Including Images
You can include images by indicating either an absolute path e.g. `https://www.example.com/images/image.png` or a relative path e.g. `/images/image.png`. For relative paths, see [storing static files in a static folder](/reference/markdown/#storing-images-and-static-files). 

In this example, `flag` is either an absolute path or a relative path to the image.

```html
<DataTable data={countries}>
	<Column id=flag contentType=image height=30px align=center />
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>
```

<DataTable data={country_summary}>
	<Column id=flag contentType=image height=30px align=center />
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>

### Link Columns

#### Link Column with Unique Labels

```html
<DataTable data={countries}>
	<Column id=country_url contentType=link linkLabel=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>
```

<DataTable data={country_summary}>
	<Column id=country_url contentType=link linkLabel=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>

#### Link Column with Consistent String Label

```html
<DataTable data={countries}>
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
	<Column id=country_url contentType=link linkLabel="Details &rarr;" />
</DataTable>
```

<DataTable data={country_summary}>
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
	<Column id=country_url contentType=link linkLabel="Details &rarr;" />
</DataTable>

### HTML Content

```sql html_in_table
select '<b>Bold</b> text' as "HTML in Table", 0 as row_number union all
select '<i>Italic</i> text', 1 union all
select '<a href="https://evidence.dev">Link</a>', 2 union all
select '<img src="https://raw.githubusercontent.com/evidence-dev/media-kit/main/png/wordmark-gray-800.png" width="200px"/>', 3 union all
select 'Inline <code class=markdown>Code</code></br> is supported', 4
order by row_number
```

````markdown
```sql html_in_table
select '<b>Bold</b> text' as "HTML in Table", 0 as row_number union all
select '<i>Italic</i> text', 1 union all
select '<a href="https://evidence.dev">Link</a>', 2 union all
select '<img src="https://raw.githubusercontent.com/evidence-dev/media-kit/main/png/wordmark-gray-800.png" width="200px"/>', 3 union all
select 'Inline <code class=markdown>Code</code></br> is supported', 4
order by row_number
```

<DataTable data={html_in_table}>
    <Column id="HTML in Table" contentType=html/>
</DataTable>
````

<DataTable data={html_in_table}>
    <Column id="HTML in Table" contentType=html/>
</DataTable>

To apply styling to most HTML tags, you should add the `class=markdown` attribute to the tag in your column. This will apply the same styling as the markdown renderer.

### Row Links

#### External Links

This example includes a column `country_url` which contains a country name as a search term in Google (e.g., `https://google.ca/search?q=canada`)

```html
<DataTable data={countries} search=true link=country_url>
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>
```

Click on a row to navigate using the row link:

<DataTable data={country_summary} search=true link=country_url>
	<Column id=country />
	<Column id=country_id align=center />
	<Column id=category />
	<Column id=value_usd />
</DataTable>

#### Link to Pages in Your Project

In this example, the SQL query contains a column with links to parameterized pages in the project. Below is an example of the SQL that could be used to generate such links:

```sql
select
    category,
    '/parameterized-pages/' || category as category_link,
    sum(sales) as sales_usd0
from needful_things.orders
group by 1
```

You can then use the `link` property of the DataTable to use your link column as a row link (`category_link` in this example):

```html
<DataTable data={orders} link=category_link />
```

By default, the link column of your table is hidden. If you would like it to be displayed in the table, you can use `showLinkCol=true`.

<img src='/img/datatable-internal-linkedtable.gif' width='500px'/>

### Styling

#### Row Shading + Row Lines

```html
<DataTable data={countries} rowShading=true />
```

<DataTable data={countries} rowShading=true />

#### Row Shading + No Row Lines

```html
<DataTable data={countries} rowShading=true rowLines=false />
```

<DataTable data={countries} rowShading=true rowLines=false />

#### No Lines or Shading

```html
<DataTable data={countries} rowLines=false />
```

<DataTable data={countries} rowLines=false />

### Column Alignment

```html
<DataTable data={country_summary}>
	<Column id=country align=right />
	<Column id=country_id align=center />
	<Column id=category align=left />
	<Column id=value_usd align=left />
</DataTable>
```

<DataTable data={country_summary}>
	<Column id=country align=right />
	<Column id=country_id align=center />
	<Column id=category align=left />
	<Column id=value_usd align=left />
</DataTable>

### Custom Column Titles

```html
<DataTable data={country_summary}>
	<Column id=country title="Country Name" />
	<Column id=country_id align=center title="ID" />
	<Column id=category align=center title="Product Category" />
	<Column id=value_usd title="Sales in 2022" />
</DataTable>
```

<DataTable data={country_summary}>
	<Column id=country title="Country Name" />
	<Column id=country_id align=center title="ID" />
	<Column id=category align=center title="Product Category" />
	<Column id=value_usd title="Sales in 2022" />
</DataTable>

### Raw Column Names

```html
<DataTable data={country_summary} formatColumnTitles=false />
```

<DataTable data={country_summary} formatColumnTitles=false />

### Groups - Accordion

#### Without subtotals

```orders
select state, category, item, count(1) as orders, sum(sales) as sales, if(random() > 0.3, 1, -1) * 0.1 * random() as growth from needful_things.orders
group by all
limit 25
```

```html
<DataTable data={orders} groupBy=state>
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>
```

<DataTable data={orders} groupBy=state>
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>

#### With Subtotals

```html
<DataTable data={orders} groupBy=state subtotals=true> 
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>
```

<DataTable data={orders} groupBy=state subtotals=true> 
 	<Column id=state/> 
	<Column id=category totalAgg=""/> 
	<Column id=item totalAgg=""/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd/> 
	<Column id=growth fmt=pct1/> 
</DataTable>

#### Closed by Default

```html
<DataTable data={orders} groupBy=state subtotals=true totalRow=true groupsOpen=false> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=countDistinct totalFmt='[=1]0 "category";0 "categories"'/> 
	<Column id=item  totalAgg=countDistinct totalFmt='[=1]0 "item";0 "items"'/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
</DataTable>
```

<DataTable data={orders} groupBy=state subtotals=true totalRow=true groupsOpen=false> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=countDistinct totalFmt='[=1]0 "category";0 "categories"'/> 
	<Column id=item  totalAgg=countDistinct totalFmt='[=1]0 "item";0 "items"'/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
</DataTable>

#### With Configured Columns

```html
<DataTable data={orders} groupBy=category subtotals=true totalRow=true> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
</DataTable>
```

<DataTable data={orders} groupBy=category subtotals=true totalRow=true> 
 	<Column id=state totalAgg=countDistinct totalFmt='0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd0k/> 
	<Column id=growth contentType=delta fmt=pct totalAgg=weightedMean weightCol=sales/> 
</DataTable>

### Groups - Section

#### Without subtotals

```html
<DataTable data={orders} groupBy=state groupType=section/>
```

<DataTable data={orders} groupBy=state groupType=section/>

#### With Subtotals

```html
<DataTable data={orders} groupBy=state subtotals=true groupType=section>
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>
```

<DataTable data={orders} groupBy=state subtotals=true groupType=section>
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>

#### With Configured Columns

```html
<DataTable data={orders} groupBy=category groupType=section subtotals=true totalRow=true totalRowColor=#fff0cc> 
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>
```

<DataTable data={orders} groupBy=category groupType=section subtotals=true totalRow=true totalRowColor=#fff0cc> 
 	<Column id=state totalAgg=countDistinct totalFmt='[=1]0 "state";0 "states"'/> 
	<Column id=category totalAgg=Total/> 
	<Column id=item  totalAgg=countDistinct totalFmt='0 "items"'/> 
	<Column id=orders contentType=colorscale/> 
	<Column id=sales fmt=usd1k/> 
	<Column id=growth contentType=delta neutralMin=-0.02 neutralMax=0.02 fmt=pct1 totalAgg=weightedMean weightCol=sales /> 
</DataTable>

### Column Groups

```sql countries
SELECT 'United States' as country, 'North America' as continent, 22996 as gdp_usd, 0.017 as gdp_growth, 0.025 as interest_rate, 0.085 as inflation_rate, 0.037 as jobless_rate, -16.7 as gov_budget, 137.2 as debt_to_gdp, -3.6 as current_account, 332.4 as population
UNION ALL
SELECT 'China', 'Asia', 17734, 0.004, 0.0365, 0.027, 0.054, -3.7, 66.8, 1.8, 1412.6
UNION ALL
SELECT 'Japan', 'Asia', 4937, 0.002, -0.001, 0.026, 0.026, -12.6, 266.2, 3.2, 125.31
UNION ALL
SELECT 'Germany', 'Europe', 4223, 0.017, 0.005, 0.079, 0.055, -3.7, 69.3, 7.4, 83.16
UNION ALL
SELECT 'United Kingdom', 'Europe', 3187, 0.029, 0.0175, 0.101, 0.038, -6, 95.9, -2.6, 67.53
UNION ALL
SELECT 'India', 'Asia', 3173, 0.135, 0.054, 0.0671, 0.078, -9.4, 73.95, -1.7, 1380
UNION ALL
SELECT 'France', 'Europe', 2937, 0.042, 0.005, 0.058, 0.074, -6.5, 112.9, 0.4, 67.63
UNION ALL
SELECT 'Italy', 'Europe', 2100, 0.047, 0.005, 0.084, 0.079, -7.2, 150.8, 2.5, 59.24
UNION ALL
SELECT 'Canada', 'North America', 1991, 0.029, 0.025, 0.076, 0.049, -4.7, 117.8, 0.1, 38.44
UNION ALL
SELECT 'South Korea', 'Asia', 1799, 0.029, 0.025, 0.057, 0.029, -6.1, 42.6, 3.5, 51.74
UNION ALL
SELECT 'Russia', 'Europe', 1776, -0.04, 0.08, 0.151, 0.039, 0.8, 18.2, 6.8, 145.55
UNION ALL
SELECT 'Brazil', 'South America', 1609, 0.032, 0.1375, 0.1007, 0.091, -4.5, 80.27, -1.8, 213.32
```

```html
<DataTable data={countries} totalRow=true rows=5 wrapTitles groupBy=continent groupType=section totalRowColor=#f2f2f2>
  <Column id=continent totalAgg="Total" totalFmt='# "Unique continents"'/>
  <Column id=country totalAgg=countDistinct totalFmt='0 "countries"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"' colGroup="GDP"/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' colGroup="GDP" contentType=delta/>
  <Column id=jobless_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' contentType=colorscale scaleColor=red colGroup="Labour Market"/>
  <Column id=population totalAgg=sum fmt='#,##0"M"' totalFmt='#,##0.0,"B"' colGroup="Labour Market"/>
  <Column id=interest_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' wrapTitle=false colGroup="Other"/>
  <Column id=inflation_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' colGroup="Other"/>
  <Column id=gov_budget totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' contentType=delta colGroup="Other"/>
  <Column id=current_account totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' colGroup="Other"/>
</DataTable>
```

<DataTable data={countries} totalRow=true rows=5 wrapTitles groupBy=continent groupType=section totalRowColor=#f2f2f2>
  <Column id=continent totalAgg="Total" totalFmt='# "Unique continents"'/>
  <Column id=country totalAgg=countDistinct totalFmt='0 "countries"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"' colGroup="GDP"/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' colGroup="GDP" contentType=delta/>
  <Column id=jobless_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' contentType=colorscale scaleColor=red colGroup="Labour Market"/>
  <Column id=population totalAgg=sum fmt='#,##0"M"' totalFmt='#,##0.0,"B"' colGroup="Labour Market"/>
  <Column id=interest_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' wrapTitle=false colGroup="Other"/>
  <Column id=inflation_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' colGroup="Other"/>
  <Column id=gov_budget totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' contentType=delta colGroup="Other"/>
  <Column id=current_account totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' colGroup="Other"/>
</DataTable>

### Wrap Titles

```html
<DataTable data={countries} wrapTitles=true /> 
```

<DataTable data={countries} wrapTitles=true /> 

# DataTable

## Options

<PropListing
    name=data
    description="Query name, wrapped in curly braces"
    required=true
    options="query name"
/>
<PropListing
    name=rows
    description="Number of rows to show in the table before paginating results. Use `rows=all` to show all rows in the table."
    required=false
    options="number | all"
    defaultValue=10
/>
<PropListing
    name=totalRow
    description="Show a total row at the bottom of the table, defaults to sum of all numeric columns"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=totalRowColor
    description="Background color of the total row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=totalFontColor
    description="Font color of the total row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=rowNumbers
    description="Turns on or off row index numbers"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=rowLines
    description="Turns on or off borders at the bottom of each row"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=rowShading
    description="Shades every second row in light grey"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=backgroundColor
    description="Background color of the table"
    required=false
    options="Hex color code | css color name"
    defaultValue="-"
/>
<PropListing
    name=sortable
    description="Enable sort for each column - click the column title to sort"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>  
<PropListing
    name=search
    description="Add a search bar to the top of your table"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=downloadable
    description="Enable download data button below the table on hover"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=formatColumnTitles
    description="Enable auto-formatting of column titles. Turn off to show raw SQL column names"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=wrapTitles
    description="Wrap column titles"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=link
    description="Makes each row of your table a clickable link. Accepts the name of a column containing the link to use for each row in your table"
    required=false
    options="column name"
    defaultValue="-"
/>
<PropListing
    name=showLinkCol
    description="Whether to show the column supplied to the `link` prop"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=generateMarkdown
    description="Helper for writing DataTable syntax with many columns. When set to true, markdown for the DataTable including each `Column` contained within the query will be generated and displayed below the table."
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    required=false
    options={["error", "warn", "pass"]}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    required=false
    options="string"
    defaultValue="No records"
/>

### Groups
Groups allow you to create sections within your table, increasing the density of the content you're displaying. Groups are currently limited to 1 level, but will be expanded in future versions.

<PropListing
    name=groupBy
    description="Column to use to create groups. Note that groups are currently limited to a single group column."
    required=false
    options="column name"
/>
<PropListing
    name=groupType
    description="How the groups are shown in the table. Can be accordion (expand/collapse) or section (group column values are merged across rows)"
    required=false
    options={['accordion', 'section']}
    defaultValue="accordion"
/>
<PropListing
    name=subtotals
    description="Whether to show aggregated totals for the groups"
    required=false
    options={['true', 'false']}
    defaultValue=false
/>
<PropListing
    name=subtotalFmt
    description="Specify an override format to use in the subtotal row (<a href='/core-concepts/formatting'>see available formats</a>). Custom strings or values are unformatted by default."
    required=false
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=groupsOpen
    description="[groupType=accordion] Whether to show the accordions as open on page load"
    required=false
    options={['true', 'false']}
    defaultValue=true
/>
<PropListing
    name=accordionRowColor
    description="[groupType=accordion] Background color for the accordion row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=subtotalRowColor
    description="[groupType=section] Background color for the subtotal row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=subtotalFontColor
    description="[groupType=section] Font color for the subtotal row"
    required=false
    options="Hex color code | css color name"
/>
<PropListing
    name=groupNamePosition
    description="[groupType=section] Where the group label will appear in its cell"
    required=false
    options={['top', 'middle', 'bottom']}
    defaultValue="middle"
/>


# Column

Use the `Column` component to choose specific columns to display in your table, and to apply options to specific columns. If you don't supply any columns to the table, it will display all columns from your query result.

## Options

<PropListing
    name=id
    description="Column id (from SQL query)"
    required=true
    options="column name"
/>
<PropListing
    name=title
    description="Override title of column"
    options="string"
    defaultValue="column name (formatted)"
/>
<PropListing
    name=align
    description="Align column text"
    options={['left', 'center', 'right']}
    defaultValue="left"
/>
<PropListing
    name=fmt
    description="Format the values in the column (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=totalAgg
    description="Specify an aggregation function to use for the total row. Accepts predefined functions, custom strings or values"
    options={['sum', 'mean', 'weightedMean', 'median', 'min', 'max', 'count', 'countDistinct', 'custom string or value']}
    defaultValue="sum"
/>
<PropListing
    name=totalFmt
    description="Specify an override format to use in the total row (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>). Custom strings or values are unformatted by default."
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=weightCol
    description="Column to use as the weight values for weighted mean aggregation. If not specified, a weight of 1 for each value will be used and the result will be the same as the `mean` aggregation."
    options="column name"
/>
<PropListing
    name=wrap
    description="Wrap column text"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=wrapTitle
    description="Wrap column title"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=contentType
    description="Lets you specify how to treat the content within a column. See below for contentType-specific options."
    options={['link', 'image', 'delta', 'colorscale', 'html']}
/>
<PropListing
    name=colGroup
    description="Group name to display above a group of columns. Columns with the same group name will get a shared header above them"
    options="string"
/>

### Images

`contentType=image`

<PropListing
    name=height
    description="Height of image in pixels"
    options="number"
    defaultValue="original height of image"
/>
<PropListing
    name=width
    description="Width of image in pixels"
    options="number"
    defaultValue="original width of image"
/>
<PropListing
    name=alt
    description="Alt text for image"
    options="column name"
    defaultValue="Name of the image file (excluding the file extension)"
/>

### Links

`contentType=link`

<PropListing
    name=linkLabel
    description="Text to display for link"
    options="column name | string"
    defaultValue="raw url"
/>
<PropListing
    name=openInNewTab
    description="Whether to open link in new tab"
    options={['true', 'false']}
    defaultValue="false"
/>

### Deltas

`contentType=delta`

<PropListing
    name=deltaSymbol
    description="Whether to show the up/down delta arrow symbol"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=downIsGood
    description="If present, negative comparison values appear in green, and positive values appear in red."
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=showValue
    description="Whether to show the delta value. Set this to false to show only the delta arrow indicator."
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=neutralMin
    description="Start of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=neutralMax
    description="End of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=chip
    description="Whether to display the delta as a 'chip', with a background color and border."
    options={['true', 'false']}
    defaultValue="false"
/>

### Conditional Formatting (Color Scales)

`contentType=colorscale`

<PropListing
    name=scaleColor
    description="Color to use for the scale"
    options={['green', 'blue', 'red', 'Hex color code', 'css color name']}
    defaultValue="green"
/>
<PropListing
    name=colorMin
    description="Set a minimum for the scale. Any values below that minimum will appear in the lowest color on the scale"
    options="number"
    defaultValue="min of column"
/>
<PropListing
    name=colorMid
    description="Set a midpoint for the scale"
    options="number"
    defaultValue="mid of column"
/>
<PropListing
    name=colorMax
    description="Set a maximum for the scale. Any values above that maximum will appear in the highest color on the scale"
    options="number"
    defaultValue="max of column"
/>
<PropListing
    name=colorBreakpoints
    description="Array of numbers to use as breakpoints for each color in your color scale. Should line up with the colors you provide in <code>scaleColor</code>"
    options="array of numbers"
/>

### HTML

`contentType=html`

To apply styling to HTML tags, you will need to add the `class=markdown` attribute **to the HTML tag in your column**. This will apply the same styling as the markdown renderer. E.g., `<code class=markdown>Code</code>`