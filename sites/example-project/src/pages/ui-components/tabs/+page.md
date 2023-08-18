## Tabs

<Tabs id="my-tabs" >
    <Tab label="Tab 1">
        This is the content of Tab 1.
    </Tab>
    <Tab label="Tab 2">
        This is the content of Tab 2.
    </Tab>
</Tabs>

## Hex

<Tabs id="my-colored-tabs" color="#f6635c">
    <Tab label="Tab 1">
        This is the content of Tab 1.
    </Tab>
    <Tab label="Tab 2">
        This is the content of Tab 2.
    </Tab>
</Tabs>

## HSL

<Tabs id="my-colored-tabs" color="hsl(50,100%, 50%)">
    <Tab label="Tab 1">
        This is the content of Tab 1.
    </Tab>
    <Tab label="Tab 2">
        This is the content of Tab 2.
    </Tab>
</Tabs>

## RGB

<Tabs id="my-colored-tabs" color="RGB(155, 155, 0)">
    <Tab label="Tab 1">
        This is the content of Tab 1.
    </Tab>
    <Tab label="Tab 2">
        This is the content of Tab 2.
    </Tab>
</Tabs>



## Evidence Install instructions


Evidence is a node.js application that runs in your terminal. It can be installed in a few different ways.


<Tabs >
<Tab label="VS Code">

The easiest way to get started with Evidence is to use the VSCode Extension.

1. Download Evidence from the VSCode Marketplace
2. Open the Command Palette (F1) and enter `Evidence: New Evidence Project`
3. Click `Start Evidence` in the bottom status bar

<LinkButton href="https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode">Download VSCode Extension</LinkButton>

</Tab>


<Tab label="CLI">

Open a terminal and run:

```shell
npx degit evidence-dev/template my-project
cd my-project
npm install
npm run dev
```

</Tab>
<Tab label="Alongside dbt">

If you already have a dbt project, you can install Evidence alongside it.

```shell
cd path/to/your/dbt/project
npx degit evidence-dev/template reports
npm --prefix ./reports install
npm --prefix ./reports run dev
```

</Tab>

<Tab label="Docker">

If you prefer to use Docker, you can run Evidence in a container.

We maintain a Docker image [here](https://hub.docker.com/r/evidencedev/evidence).

</Tab>

</Tabs>


## Code Snippets

Suppose we are working with a table that looks like this:

| id | col1 | col2 | col3 |
| -- | ---- | ---- | ---- |
| 1  | a    | d    | g    |
| 2  | b    | e    | h    |
| 3  | c    | f    | i    |


We need to "unpivot" the table. You can do this in any language, but here's how to do it in SQL, Python, and R.

<Tabs >
<Tab label="SQL">

```sql
select
    id,
    key,
    value
from
    my_table
unpivot
    (value for key in (col1, col2, col3))
```

</Tab>
<Tab label="Python">

```python
import pandas as pd

df = pd.DataFrame({
    'id': [1, 2, 3],
    'col1': ['a', 'b', 'c'],
    'col2': ['d', 'e', 'f'],
    'col3': ['g', 'h', 'i']
})

df.melt(id_vars=['id'], var_name='key', value_name='value')
```

</Tab>
<Tab label="R">

```r
library(tidyr)

df <- data.frame(
    id = c(1, 2, 3),
    col1 = c('a', 'b', 'c'),
    col2 = c('d', 'e', 'f'),
    col3 = c('g', 'h', 'i')
)

df %>% pivot_longer(cols = starts_with("col"), names_to = "key", values_to = "value")
```

</Tab>
</Tabs>