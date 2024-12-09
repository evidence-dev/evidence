const NO_QUERY = `
# This is a markdown!
`;

const NOT_QUITE_A_QUERY = `
\`\`almost
SELECT false
\`\`\`
`;

const REAL_CODE = `
\`\`\`javascript
console.log("🧂")
\`\`\`
`;

const INDENTED_CODE = `
    {
        "x": "y"
    }
`;

const INDENTED_QUERY = `
    SELECT 1;
`;

const ONE_QUERY = `
\`\`\`someQuery
SELECT 1;
\`\`\`

# This is a markdown!

<BoxPlot data={someQuery}/>
`;

const TWO_QUERIES = `
\`\`\`someQuery
SELECT 1;
\`\`\`

\`\`\`someOtherQuery
SELECT 1;
\`\`\`

# This is a markdown!

<BoxPlot data={someQuery}/>
<BoxPlot data={someOtherQuery}/>
`;

const REAL_MARKDOWN_FILE = `
# Code Blocks

Often it's useful to include code blocks in your documentation. You do this by using special reserved keywords to name your code fences.

## Code Blocks

Below are a few examples

### Normal SQL

\`\`\`input
select 
    date_trunc('month', order_datetime) as month, 
    category, 
    sum(sales) as sales_usd0k,
    count(sales) as num_orders_num0,
    sales_usd0k / count(sales) as aov_usd2
from orders
group by month, category
order by month, sales_usd0k desc
\`\`\`

\`\`\`working_reference
    select count(*) as n_days from \${input}
\`\`\`

\`\`\`sql reviews
select * from reviews
\`\`\`

\`\`\`sql
select * from a_table_that_isnt_connected
\`\`\`

### JavaScript

\`\`\`javascript
let x = 100;
let y = 200;
let z = x + y;
\`\`\`

### Python

\`\`\`python
import numpy as np

x = np.array([1, 2, 3])
y = np.array([4, 5, 6])
z = x + y
\`\`\`


### CSS

\`\`\`css
pre {
    overflow: scroll;
    border-radius: 3px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}
\`\`\`

### HTML

\`\`\`html
<head>
<title>My Page</title>
</head>
<body>
<h1>My Page</h1>
<p>This is my page.</p>
<!-- a really long line of code-->
<p>Here is another paragraph. It is really long and will need scroll if possible.</p>
</body>
\`\`\`

### Bash

To install Evidence you need to run the following command in your terminal:

\`\`\`bash
npx degit evidence-dev/template my-project
cd my-project
npm install
npm run dev
\`\`\`

You can also use them directly like this

<CodeBlock>
let x = 100;
let y = 200;
let z = x + y;
</CodeBlock>

`;

module.exports = {
	NO_QUERY,
	NOT_QUITE_A_QUERY,
	REAL_CODE,
	INDENTED_CODE,
	INDENTED_QUERY,
	ONE_QUERY,
	TWO_QUERIES,
	REAL_MARKDOWN_FILE
};
