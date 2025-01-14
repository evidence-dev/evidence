---
title: Last Refreshed
sidebar_position: 1
---

Displays the last time the data was refreshed. This component is useful for showing users how up-to-date the data is.

<DocTab>
    <div slot='preview'>
        <LastRefreshed/>
    </div>

```markdown
<LastRefreshed/>
```
</DocTab>

## Examples

### Alternative Prefix

<DocTab>
    <div slot='preview'>
        <LastRefreshed prefix="Data last updated"/>
    </div>

```markdown
<LastRefreshed prefix="Data last updated"/>
```
</DocTab>

## Options

<PropListing
    name=prefix
    description="Text to display before the last refreshed time"
    options=string
    defaultValue="Last refreshed"
/>

<PropListing 
    name="printShowDate"
    options={['true', 'false']}
    defaultValue="true"
>

On print/PDF, will show the date and time rather than "X hours ago".

</PropListing>

<PropListing
    name=dateFmt
    options="Excel-style format | built-in format | custom format"
>

If `printShowDate` is `true`, format to use for the date ([see available formats](/core-concepts/formatting))

</PropListing>