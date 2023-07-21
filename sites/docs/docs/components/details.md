---
title: Details
sidebar_position: 30
---

The details component allows you to add a collapsible section to your markdown. This is useful for adding additional information that you don't want to be visible by default.

## Default state

<img src="/img/details.png" alt="Details default state" width="600"/>

## Expanded state

<img src="/img/details-expanded.png" alt="Details expanded" width="600"/>


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

## Props

| Name   | Description                                                             | Required | 
|--------|-------------------------------------------------------------------------|----------|
| title  | The text show next to the triangle icon.                                | No       |


