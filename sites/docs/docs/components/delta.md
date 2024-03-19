---
sidebar_position: 2
title: Delta
hide_table_of_contents: false
---

<img src="/img/delta-pos.png" width="150"/>

```markdown
<Delta data={sales} column=growth fmt=pct1 />
```

## Examples

### Value Types

```markdown
<Delta data={sales} column=growth fmt=pct1 />
```

#### Positive

<img src="/img/delta-pos.png" width="130"/>

#### Negative 

<img src="/img/delta-neg.png" width="150"/>

#### Neutral*
*Values are not defined as neutral until you define a range using the `neutralMin` and `neutralMax` props
```markdown
<Delta data={sales} column=growth fmt=pct1 neutralMin=-0.4 neutralMax=0.4 />
```
<img src="/img/delta-neut.png" width="130"/>

### Chips

```html
<Delta data={sales} column=growth fmt=pct1 chip=true />
```

#### Positive

<img src="/img/delta-chip-pos.png" width="130"/>

#### Negative 

<img src="/img/delta-chip-neg.png" width="130"/>

#### Neutral*
*Values are not defined as neutral until you define a range using the `neutralMin` and `neutralMax` props
```markdown
<Delta data={sales} column=growth fmt=pct1 chip=true neutralMin=-0.4 neutralMax=0.4 />
```
<img src="/img/delta-chip-neut.png" width="130"/>

### Symbol Position

#### Symbol on Left

```html
<Delta data={sales} column=growth fmt=pct1 symbolPosition=left/>
```

<img src="/img/delta-left.png" width="130"/>

#### Symbol on Left in Chip

```html
<Delta data={sales} column=growth fmt=pct1 chip=true symbolPosition=left/>
```

<img src="/img/delta-left-neg.png" width="130"/>

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
        <td>column</td>	
        <td>Column to pull values from</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>column name</td>	
        <td class='tcenter'>First column</td>
    </tr>
    <tr>	
        <td>row</td>	
        <td>Row number to display. 0 is the first row.</td>	
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>		
        <td class='tcenter'>0</td>
    </tr>
    <tr>	
        <td>value</td>	
        <td>Pass a specific value to the component (e.g., value=100). Overridden by the data/column props.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>number</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>fmt</td>	
        <td>Format to use for the value (<a href='/core-concepts/formatting'>see available formats</a>)</td>	
        <td class='tcenter'>-</td>
        <td class='tcenter'>Excel-style format | built-in format | custom format</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>
        <td>downIsGood</td>
        <td>If true, negative comparison values appear in green, and positive values appear in red.</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>  
    <tr>
        <td>showSymbol</td>
        <td>Whether to show the up/down delta arrow symbol</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>true</td>
    </tr>
        <tr>
        <td>showValue</td>
        <td>Whether to show the value. Set this to false to show only the delta arrow indicator.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>true</td>
    </tr>
    <tr>
        <td>neutralMin</td>
        <td>Start of the range for "neutral" values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>0</td>
    </tr>
    <tr>
        <td>neutralMax</td>
        <td>End of the range for "neutral" values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>number</td>
        <td class='tcenter'>0</td>
    </tr>
    <tr>
        <td>chip</td>
        <td>Whether to display the delta as a "chip", with a background color and border.</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>false</td>
    </tr>
    <tr>
        <td>symbolPosition</td>
        <td>Whether to display the delta symbol to the left or right of the value</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>left | right</td>
        <td class='tcenter'>right</td>
    </tr>
    <tr>	<td>emptySet</td>	<td>Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in <code>build:strict</code>. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>error | warn | pass</td>	<td class='tcenter'>error</td>	</tr>
<tr>	<td>emptyMessage</td>	<td>Text to display when an empty dataset is received - only applies when <code>emptySet</code> is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>No records</td>	</tr>
</table>
