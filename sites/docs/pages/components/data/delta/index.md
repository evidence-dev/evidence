---
sidebar_position: 1
title: Delta
description: Display an inline indicator that shows how a value has changed.
---

Use a Delta component to display an inline indicator that shows how a value has changed.

```sql growth
select 0.366 as positive, -0.366 as negative, 0.01 as neutral
```

<DocTab>
    <div slot='preview'>
        This value is <Delta data={growth} column=positive fmt="+0.0%;-0.0%;0.0%" /> since last month.
    </div>

```markdown
This value is <Delta data={growth} column=positive fmt="+0.0%;-0.0%;0.0%" /> since last month.
```
</DocTab>

## Examples

### Value Types

#### Positive

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=positive fmt=pct1 />
    </div>

```markdown
<Delta data={growth} column=positive fmt=pct1 />
```
</DocTab>

#### Negative 

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=negative fmt=pct1 />
    </div>

```markdown
<Delta data={growth} column=negative fmt=pct1 />
```
</DocTab>

#### Neutral*
*Values are not defined as neutral until you define a range using the `neutralMin` and `neutralMax` props

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=neutral fmt=pct1 neutralMin=-0.02 neutralMax=0.02/>
    </div>

```markdown
<Delta data={growth} column=neutral fmt=pct1 neutralMin=-0.02 neutralMax=0.02 />
```
</DocTab>

### Chips

#### Positive

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=positive fmt=pct1 chip=true />
    </div>

```markdown
<Delta data={growth} column=growth fmt=pct1 chip=true />
```
</DocTab>


#### Negative 

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=negative fmt=pct1 chip=true/>
    </div>

```markdown
<Delta data={growth} column=negative fmt=pct1 chip=true/>
```
</DocTab>

#### Neutral*
*Values are not defined as neutral until you define a range using the `neutralMin` and `neutralMax` props

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=neutral fmt=pct1 neutralMin=-0.02 neutralMax=0.02 chip=true/>
    </div>

```markdown
<Delta data={growth} column=neutral fmt=pct1 chip=true neutralMin=-0.02 neutralMax=0.02 />
```
</DocTab>

### Symbol Position

#### Symbol on Left

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=positive fmt=pct1 symbolPosition=left/>
    </div>


```html
<Delta data={growth} column=positive fmt=pct1 symbolPosition=left/>
```
</DocTab>

#### Symbol on Left in Chip

<DocTab>
    <div slot='preview'>
        <Delta data={growth} column=positive fmt=pct1 symbolPosition=left chip=true/>
    </div>

```html
<Delta data={growth} column=positive fmt=pct1 chip=true symbolPosition=left/>
```
</DocTab>

## Options
<PropListing
    name=data
    required
    options="query name"
>

Query name, wrapped in curly braces

</PropListing>
<PropListing
    name=column
    options="column name"
    defaultValue="First column"
>

Column to pull values from

</PropListing>
<PropListing
    name=row
    options="number"
    defaultValue="0"
>

Row number to display. 0 is the first row.

</PropListing>
<PropListing
    name=value
    options="number"
>

Pass a specific value to the component (e.g., value=100). Overridden by the data/column props.

</PropListing>
<PropListing
    name=fmt
    options="Excel-style format | built-in format | custom format"
>

Format to use for the value ([see available formats](/core-concepts/formatting))

</PropListing>
<PropListing
    name=downIsGood
    options={['true', 'false']}
    defaultValue="false"
>

If true, negative comparison values appear in green, and positive values appear in red.

</PropListing>
<PropListing
    name=showSymbol
    options={['true', 'false']}
    defaultValue="true"
>

Whether to show the up/down delta arrow symbol

</PropListing>
<PropListing
    name=showValue
    options={['true', 'false']}
    defaultValue="true"
>

Whether to show the value. Set this to false to show only the delta arrow indicator.

</PropListing>
<PropListing
    name=text
    options="string"
>

Text to display after the delta symbol and value

</PropListing>
<PropListing
    name=neutralMin
    options="number"
    defaultValue="0"
>

Start of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values.

</PropListing>
<PropListing
    name=neutralMax
    options="number"
    defaultValue="0"
>

End of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values.

</PropListing>
<PropListing
    name=chip
    options={['true', 'false']}
    defaultValue="false"
>

Whether to display the delta as a 'chip', with a background color and border.

</PropListing>
<PropListing
    name=symbolPosition
    options={['left', 'right']}
    defaultValue="right"
>

Whether to display the delta symbol to the left or right of the value

</PropListing>
<PropListing
    name=emptySet
    options={['error', 'warn', 'pass']}
    defaultValue="error"
>

Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed.

</PropListing>
<PropListing
    name=emptyMessage
    options="string"
    defaultValue="No records"
>

Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.).

</PropListing>