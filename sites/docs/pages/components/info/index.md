---
sidebar_position: 1
title: Info
---

The Info component can be used on a standalone basis as shown on this page, or can be used as part of other components which support the `description` prop (including Column, BigValue, Value, and more).

<DocTab>
    <div slot='preview'>
        Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" />
    </div>

```markdown
Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" />
```
</DocTab>

## Examples

### Inline Usage

<DocTab>

<div slot=preview>
Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" />
</div>

```markdown
Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" />
```

</DocTab>


### Theme Color

<DocTab>

<div slot=preview>
Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" color="primary" />
</div>

```markdown
Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" color="primary" />
```

</DocTab>


### Custom Color

<DocTab>

<div slot=preview>
Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" color="red" />
</div>

```markdown
Data was sourced from the World Bank <Info description="World Economic Indicators dataset from past 12 months" color="red" />
```

</DocTab>

## Options

<PropListing
    name=description
    required
    options="string"
>

Text content for the tooltip.

</PropListing>
<PropListing
    name=color
    options="string"
    defaultValue="base-content-muted"
>

Color of the tooltip content.

</PropListing>
<PropListing
    name=size
    options="number"
    defaultValue="4"
>

Size of the icon.

</PropListing>
<PropListing
    name=className
    options="string"
>

Custom class names for the tooltip trigger.

</PropListing>
