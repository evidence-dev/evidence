---
sidebar_position: 1
title: Delta
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

<PropListing
    name=data
    description="Query name, wrapped in curly braces"
    required
    options="query name"
/>
<PropListing
    name=column
    description="Column to pull values from"
    options="column name"
    defaultValue="First column"
/>
<PropListing
    name=row
    description="Row number to display. 0 is the first row."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=value
    description="Pass a specific value to the component (e.g., value=100). Overridden by the data/column props."
    options="number"
/>
<PropListing
    name=fmt
    description="Format to use for the value (<a href='/core-concepts/formatting'>see available formats</a>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=downIsGood
    description="If true, negative comparison values appear in green, and positive values appear in red."
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=showSymbol
    description="Whether to show the up/down delta arrow symbol"
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=showValue
    description="Whether to show the value. Set this to false to show only the delta arrow indicator."
    options={['true', 'false']}
    defaultValue="true"
/>
<PropListing
    name=text
    description="Text to display after the delta symbol and value"
    options="string"
/>
<PropListing
    name=neutralMin
    description="Start of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=neutralMax
    description="End of the range for 'neutral' values, which appear in grey font with a dash instead of an up/down arrow. By default, neutral is not applied to any values."
    options="number"
    defaultValue="0"
/>
<PropListing
    name=chip
    description="Whether to display the delta as a 'chip', with a background color and border."
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing
    name=symbolPosition
    description="Whether to display the delta symbol to the left or right of the value"
    options={['left', 'right']}
    defaultValue="right"
/>
<PropListing
    name=emptySet
    description="Sets behaviour for empty datasets. Can throw an error, a warning, or allow empty. When set to 'error', empty datasets will block builds in `build:strict`. Note this only applies to initial page load - empty datasets caused by input component changes (dropdowns, etc.) are allowed."
    options={['error', 'warn', 'pass']}
    defaultValue="error"
/>
<PropListing
    name=emptyMessage
    description="Text to display when an empty dataset is received - only applies when `emptySet` is 'warn' or 'pass', or when the empty dataset is a result of an input component change (dropdowns, etc.)."
    options="string"
    defaultValue="No records"
/>
