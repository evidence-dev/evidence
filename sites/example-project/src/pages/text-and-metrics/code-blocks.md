# Code Blocks

Often it's useful to include code blocks in your documentation. You do this by using special reserved keywords to name your code blocs.

## Code Blocks

Below are a few examples

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

### SQL

```sql reviews
select * from reviews
```

```sql
select * from a_table_that_is_not_connected
```


```orders
select * from orders
```


### PRQL

```prql marketing_spend_from_a_prql_query
from marketing_spend
filter month_begin >= '2020-01-01'
take 10
```


You can also use them directly like this

<CodeBlock>
let x = 100;
let y = 200;
let z = x + y;
</CodeBlock>

