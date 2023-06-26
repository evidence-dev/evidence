---
sidebar_position: 2
title: Big Value

hide_table_of_contents: false
---

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

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>data</td>	
        <td>Query name, wrapped in curly braces</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>query name</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>value</td>	
        <td>Column to pull the main value from.</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>comparison</td>	
        <td>Column to pull the comparison value from.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>sparkline</td>	
        <td>Column to pull the date from to create the sparkline.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>title</td>	
        <td>Title of the card.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>Title of the value column.</td>
    </tr>
    <tr>	
        <td>comparisonTitle</td>	
        <td>Text to the right of the comparison.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>Title of the comparison column.</td>
    </tr>
    <tr>	
        <td>downIsGood</td>	
        <td>If present, negative comparison values appear in green, and positive values appear in red.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>	
        <td>minWidth</td>	
        <td>Overrides min-width of component</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>% or px value</td>	
        <td class='tcenter'>18%</td>
    </tr>
    <tr>	
        <td>maxWidth</td>	
        <td>Adds a max-width to the component</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>% or px value</td>	
        <td class='tcenter'>none</td>
    </tr>
    <tr>	
        <td>fmt</td>	
        <td>Sets format for the value (<a href='/core-concepts/formatting'>see available formats</a>)</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>comparisonFmt</td>	
        <td>Sets format for the comparison (<a href='/core-concepts/formatting'>see available formats</a>)</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>	
        <td class='tcenter'>-</td>
    </tr>
</table>
