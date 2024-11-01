---
title: Slider
sidebar_position: 1
---

Creates a Slider input with default min, max and step values

<DocTab>
    <div slot="preview">
        <Slider
            title="sales" 
            name=sales
            defaultValue=50
            fmt="usd0"
        />
    </div>

````markdown
<Slider
    title="sales" 
    name=sales
    defaultValue=50
    fmt="usd0"
/>
````
</DocTab>

Min and Max values can be defined, the step property and define the incremental value of the slider

<DocTab>
    <div slot="preview">
<Slider
    title="Months" 
    name=monthsWithSteps
    min=0
    max=36
    step=12
/>
    </div>

````markdown
<Slider
    title="Months" 
    name=monthsWithSteps
    min=0
    max=36
    step=12
/>
````
</DocTab>

showMaxMin property can hide the Max and Min values with false, by default showMaxMin is true

<DocTab>
 <div slot="preview">
<Slider
    title="Months" 
    name=monthsWithoutMinMax
    min=0
    max=36
    showMaxMin=false
/>
 </div>

````markdown
<Slider
    title="Months" 
    name=monthsWithoutMinMax
    min=0
    max=36
    showMaxMin=false
/>
````
</DocTab>

The default size of the slider can be altered with the size property using; medium, large or full

<DocTab>
    <div slot="preview">
<Slider
    title="Months Medium" 
    name=monthsMedium
    defaultValue=4
    min=0
    max=36
    size=medium
/>
    </div>

````markdown
<Slider
    title="Months Medium" 
    name=monthsMedium
    defaultValue=4
    min=0
    max=36
    size=medium
/>
````
</DocTab>


<DocTab>
    <div slot="preview">
<Slider
    title="Months Large" 
    name=monthsLarge
    defaultValue=18
    min=0
    max=36
    size=large
/>
    </div>

````markdown
<Slider
    title="Months Large" 
    name=monthsLarge
    defaultValue=18
    min=0
    max=36
    size=large
/>
````
</DocTab>

<DocTab>
    <div slot="preview">
<Slider
    title="Months Full" 
    name=monthsFull
    defaultValue=26
    min=0
    max=36
    size=full
/>
    </div>

````markdown
<Slider
    title="Months Full" 
    name=monthsFull
    min=0
    max=36
    size=full
/>
````
</DocTab>


# Slider

## Options

<PropListing 
    name="Name"
    required
>

name of the slider, used to reference the selected value elsewhere as `{inputs.name}`

</PropListing>
<PropListing 
    name="defaultValue"
>

Sets the initial value of the silder

</PropListing>
<PropListing 
    name="min"
    options=number
    defaultValue=0
>

Sets the minimum value on the slider. Negative Values accepted.

</PropListing>
<PropListing 
    name="max"
    options=number
    defaultValue=100
>

Sets the maximum value on the slider. This value must be larger than the min.

</PropListing>
<PropListing 
    name="step"
    options=number
    defaultValue=1
>

Defines the incremental value of the slider

</PropListing>
<PropListing 
    name="showMinMax"
    options="boolean"
    defaultValue="true"
>

Hides or shows min and max value markers on slider.  

</PropListing>
<PropListing 
    name="size"
    size="string"
    defaultValue=""
>

Sets the length of the slider. Options are "medium", large" or "full". A empty string of any other strings will not result in default size.
</PropListing>
<PropListing
    name="fmt"
    description="Sets format for the value (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>






