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

## Options

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
        <tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
</table>

### Sparkline Options

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>sparklineType</td>	
        <td>Chart type for sparkline</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>line | area | bar</td>	
        <td class='tcenter'>line</td>	
    </tr>
    <tr>	
        <td>sparklineValueFmt</td>	
        <td>Formatting for tooltip values</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>format code</td>	
        <td class='tcenter'>same as fmt if supplied</td>	
    </tr>
    <tr>	
        <td>sparklineDateFmt</td>	
        <td>Formatting for tooltip dates</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>format code</td>	
        <td class='tcenter'>YYYY-MM-DD</td>	
    </tr>
    <tr>	
        <td>sparklineColor</td>	
        <td>Color of visualization</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>CSS name | hexademical | RGB | HSL</td>	
        <td class='tcenter'>-</td>	
    </tr>
    <tr>	
        <td>sparklineYScale</td>	
        <td>Whether to truncate the y-axis of the chart to enhance visibility</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>	
        <td class='tcenter'>false</td>	
    </tr>
    <tr>	
        <td>connectGroup</td>	
        <td>Group name to connect this sparkline to other charts for synchronized tooltip hovering. Charts with the same <code>connectGroup</code> name will become connected</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>string</td>	
        <td class='tcenter'>-</td>	
    </tr>
</table>