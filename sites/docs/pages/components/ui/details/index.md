---
title: Details
description: Add a collapsible section of markdown content that can be expanded to reveal more information.
sidebar_position: 1
---

The details component allows you to add a collapsible section to your markdown. This is useful for adding additional information that you don't want to be visible by default, but can be expanded by the reader.

## Default state

<DocTab>
    <div slot='preview'>
        <Details title="Definitions">

            Definition of metrics in Solutions Targets

            ### Time to Proposal

            Average number of days it takes to create a proposal for a customer

            *Calculation:*
            Sum of the number of days it took to create each proposal, divided by the number of proposals created

            *Source:*
            Hubspot

        </Details>
    </div>

````markdown
<Details title="Definitions">
    
    Definition of metrics in Solutions Targets

    ### Time to Proposal

    Average number of days it takes to create a proposal for a customer

    *Calculation:*
    Sum of the number of days it took to create each proposal, divided by the number of proposals created

    *Source:*
    Hubspot

</Details>
````
</DocTab>

## Expanded state

<DocTab>
    <div slot='preview'>
        <Details title="Definitions" open=true>

            Definition of metrics in Solutions Targets

            ### Time to Proposal

            Average number of days it takes to create a proposal for a customer

            *Calculation:*
            Sum of the number of days it took to create each proposal, divided by the number of proposals created

            *Source:*
            Hubspot

        </Details>
    </div>

```markdown
<Details title="Definitions">
    
    Definition of metrics in Solutions Targets

    ### Time to Proposal

    Average number of days it takes to create a proposal for a customer

    *Calculation:*
    Sum of the number of days it took to create each proposal, divided by the number of proposals created

    *Source:*
    Hubspot

</Details>
```
</DocTab>

## Options

<PropListing 
    name="title"
    defaultValue="Details"
>

The text shown next to the triangle icon.

</PropListing>
<PropListing 
    name="open"
    options={['true', 'false']}
    defaultValue="false"
>

Whether expanded by default.

</PropListing>
<PropListing 
    name="printShowAll"
    options={['true', 'false']}
    defaultValue="true"
>

On print/PDF, the Details component will expand by default. Turn this off to leave the component collapsed in print.

</PropListing>