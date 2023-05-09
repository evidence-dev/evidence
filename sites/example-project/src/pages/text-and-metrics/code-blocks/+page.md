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
from orders
group by month, category
order by month, sales_usd0k desc
```

```sql working_reference
    select count(*) as n_months from ${orders_by_category}
```

```sql reviews
select * from reviews
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
	background: var(--grey-800);
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
