---
title: Details
sidebar_position: 1
---

The details component allows you to add a collapsible section to your markdown. This is useful for adding additional information that you don't want to be visible by default.

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