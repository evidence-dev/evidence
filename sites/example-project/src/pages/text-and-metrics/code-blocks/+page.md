# Code Blocks

Often it's useful to include code blocks in your documentation. You do this by using special reserved keywords to name your code fences.

## Code Blocks

Below are a few examples

### Normal SQL 

```input 
select 
    complaint_description as description,
    extract(date from created_date) as date, 
    count(*) as number_of_complaints 
from `bigquery-public-data.austin_311.311_service_requests` 
where created_date >= timestamp_sub(current_timestamp(), interval 180 day)
group by 1,2 
```

```working_reference 
    select count(*) as n_days from ${input}
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

