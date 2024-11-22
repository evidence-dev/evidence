# Code Blocks

Often it's useful to include code blocks in your documentation. You do this by using special reserved keywords to name your code fences.

## Code Blocks

Below are a few examples

### Normal SQL

```sql orders_by_category
select
    date_trunc('month', order_datetime) as month,
    category,
    sum(sales) as sales_usd0k,
    count(sales) as num_orders_num0
from needful_things.orders
group by month, category
order by month, sales_usd0k desc
```

```sql working_reference
    select count(*) as n_months from ${orders_by_category}
```

```sql reviews
select * from needful_things.reviews
```

```sql
select * from a_table_that_isnt_connected
```

### JavaScript

```javascript
let x = 100;
let y = 200;
let z = x + y;
```

### Python

```python
import numpy as np

x = np.array([1, 2, 3])
y = np.array([4, 5, 6])
z = x + y
```

### CSS

```css
pre {
	overflow: scroll;
	background: #1f2937;
	border-radius: 3px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
}
```

### HTML

```html
<head>
	<title>My Page</title>
</head>
<body>
	<h1>My Page</h1>
	<p>This is my page.</p>
	<!-- a really long line of code-->
	<p>Here is another paragraph. It is really long and will need scroll if possible.</p>
</body>
```

### Svelte

```svelte
<DataTable data={countries} totalRow=true rows=5 wrapTitles groupBy=continent groupType=section totalRowColor=#f2f2f2>
  <Column id=continent totalAgg="Total" totalFmt='# "Unique continents"'/>
  <Column id=country totalAgg=countDistinct totalFmt='0 "countries"'/>
  <Column id=gdp_usd totalAgg=sum fmt='$#,##0"B"' totalFmt='$#,##0.0,"T"' colGroup="GDP"/>
  <Column id=gdp_growth totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' colGroup="GDP" contentType=delta/>
  <Column id=jobless_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct1' contentType=colorscale scaleColor=negative colGroup="Labour Market"/>
  <Column id=population totalAgg=sum fmt='#,##0"M"' totalFmt='#,##0.0,"B"' colGroup="Labour Market"/>
  <Column id=interest_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' wrapTitle=false colGroup="Other"/>
  <Column id=inflation_rate totalAgg=weightedMean weightCol=gdp_usd fmt='pct2' colGroup="Other"/>
  <Column id=gov_budget totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' contentType=delta colGroup="Other"/>
  <Column id=current_account totalAgg=weightedMean weightCol=gdp_usd fmt='0.0"%"' colGroup="Other"/>
</DataTable>
```

### Bash

To install Evidence you need to run the following command in your terminal:

```bash
npx degit evidence-dev/template my-project
cd my-project
npm install
npm run dev
```

You can also use them directly like this

<CodeBlock>
let x = 100;
let y = 200;
let z = x + y;
</CodeBlock>
