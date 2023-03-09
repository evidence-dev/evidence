---
sidebar_position: 2
title: Big Value
hide_title: true
hide_table_of_contents: false
---

<h1 class="community-header"><span class="gradient">&lt;BigValue/></span></h1>

`<BigValue />` displays a large value, and can be configured to include a comparison and a sparkline.

## Example 

```markdown
<BigValue 
    data={query_name} 
    value='new_activations' 
    comparison='monthly_growth' 
    sparkline='date'
    comparisonTitle="Month over Month"
    maxWidth='10em'
/> 
```

![bigvalue](/img/bigvalueexample.png)

## Multiple cards 

Multiple cards will align themselves into a row. 

![bigvalue](/img/bigvaluerow.png)


## All Options 
* **data** - query name, wrapped in curly braces
* **value** - required column to pull the main value from.
* **comparison** - (Optional) column to pull the comparison value from. 
* **sparkline** - (Optional) column to pull the date from to create the sparkline. 
* **title** - (Optional) title of the card. Defaults to the title of the value column.
* **comparisonTitle** - (Optional) text to the right of the comparison. Defaults to the title of the comparison column.
* **downIsGood** - (Optional) if present, negative comparison values appear in green, and positive values appear in red. 
* **minWidth** - (Optional) overrides min-width of component, 18% by default. 
* **maxWidth** - (Optional) adds a max-width to the component, none by default. 





