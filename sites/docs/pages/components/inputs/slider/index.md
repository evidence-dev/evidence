---
title: Slider
description: Display a linear input to select a value from a range.
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

showInput property can show the input field with true, by default showInput is false

<DocTab>
 <div slot="preview">
<Slider
    title="Months" 
    name=monthsWithInput
    min=0
    max=36
    showInput=true
/>
 </div>

````markdown
<Slider
    title="Months" 
    name=monthsWithInput
    min=0
    max=36
    showInput=true
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


````sql flight_data
		SELECT
	  CAST(fare AS INT) AS fare,
	  CAST((SELECT MAX(fare) FROM flights) AS INT) AS max_fare,
	FROM flights
	LIMIT 100
````

## Specifying Dynamic Columns

Supply data with a specified column name to define the slider's min and max values. The slider's range will be calculated based on the column's minimum and maximum values.

<DocTab>
    <div slot="preview">
<Slider
    title='data slider'
    name='RangeSlider'
    size=large
    step=100
    data={flight_data}
    range=fare
/>
    </div>

````markdown
<Slider
    title='data slider'
    name='RangeSlider'
    size=large
    step=100
    data={flight_data}
    range=fare
/>
````
</DocTab>

Supply data with specified column names for minColumn, maxColumn, and/or defaultValue. The first row’s value in each of these columns will determine the minimum, maximum, or default value, respectively.

<DocTab>
    <div slot='preview'>
<Slider
    title='data slider'
    name='MaxColSlider'
    size=large
    step=100
    data={flight_data}
    maxColumn=max_fare
    min=0
    defaultValue=max_fare
/>
    </div>

````markdown
<Slider
    title='data slider'
    name='MaxColSlider'
    size=large
    step=100
    data={flight_data}
    maxColumn=max_fare
    min=0
    defaultValue=max_fare
/>
````
</DocTab>

# Slider

## Options

<PropListing 
    name="name"
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
    name="data"
    description="Query name, wrapped in curly braces"
    options="query name"
/>
<PropListing
    name="range"
    description="Required for data - Take and sets the max and min values of a column"
    options="string - column name"
/>
<PropListing
    name="maxColumn"
    description="Takes the first value of a column and assigns it to the max value"
    options="string - column name"
/>
<PropListing
    name="minColumn"
    description="Takes the first value of a column and assigns it to the min value"
    options="string - column name"
/>
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
    name="showInput"
    options="boolean"
    defaultValue="false"
>

Hides or shows the input field on the slider.

</PropListing>
<PropListing 
    name="size"
    options="{["small", "medium", "large", "full"]}"
    defaultValue="small"
>
Sets the length of the slider
</PropListing>
<PropListing
    name="fmt"
    description="Sets format for the value (<a class=markdown href='/core-concepts/formatting'>see available formats<a/>)"
    options="Excel-style format | built-in format | custom format"
/>
<PropListing
    name=description
    options="string"
>

Adds an info icon with description tooltip on hover

</PropListing>
<PropListing 
    name="hideDuringPrint"
    description="Hide the component when the report is printed"
    options={["true", "false"]}
    default="true"
/>






