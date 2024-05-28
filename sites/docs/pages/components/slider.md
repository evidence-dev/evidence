---
title: Slider
sidebar_position: 1
---

Creates a Slider input with default min, max and step values


<Slider
    title="Months" 
    name=months
    defaultValue=18
/>

````markdown
<Slider
    title="Months" 
    name=months
    defaultValue=18
/>
````

Min and Max values can be defined, the step property and define the incremental value of the slider

<Slider
    title="Months" 
    name=monthsWithSteps
    min=0
    max=36
    step=12
/>


````markdown
<Slider
    title="Months" 
    name=monthsWithSteps
    min=0
    max=36
    step=12
/>
````

showMaxMin property can hide the Max and Min values with false, By default showMaxMin is true

<Slider
    title="Months" 
    name=monthsWithoutMinMax
    min=0
    max=36
    showMaxMin=false
/>

````markdown
<Slider
    title="Months" 
    name=monthsWithoutMinMax
    min=0
    max=36
    showMaxMin=false
/>
````

The default size of the slider can be altered with the size property using; medium, large or full

<Slider
    title="Months" 
    name=monthsMedium
    min=0
    max=36
    size=medium
/>

<Slider
    title="Months" 
    name=monthsLarge
    min=0
    max=36
    size=large
/>
<Slider
    title="Months" 
    name=monthsLarge
    min=0
    max=36
    size=full
/>

````markdown
<Slider
    title="Months" 
    name=monthsLarge
    min=0
    max=36
    size=large
/>
````






