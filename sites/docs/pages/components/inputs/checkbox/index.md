---
title: Checkbox
description: Display a toggleable box for a boolean value.
sidebar_position: 1
---

Creates a checkbox with toggleable input. The Title and Name attributes can be defined, enabling the passing of true and false values. 

<DocTab>
    <div slot='preview'>
        <Checkbox
            title="Hide Months 0" 
            name=hide_months_0
        />
    </div>

````markdown
<Checkbox
    title="Hide Months 0" 
    name=hide_months_0 
/>
````
</DocTab>

### Checkbox using Default Value

Defining the defaultValue property will set the initial checked value with true and false.

<!-- <img src="/img/" alt="checkbox" width="300"/> -->

<DocTab>
    <div slot='preview'>
        <Checkbox
            title="Title of checkbox" 
            name=name_of_checkbox
            defaultValue=true
        />

        Selected Value: {inputs.name_of_checkbox}
    </div>

```markdown
<Checkbox
    title="Title of checkbox" 
    name=name_of_checkbox
    defaultValue=true
/>

Selected Value: {inputs.name_of_checkbox}
```
</DocTab>




```sql orders
select 
    COUNT(*) as records_count
from needful_things.orders
WHERE  not ${inputs.exclude_low_value} -- When True, Do not evaluate the next condition
    OR ( 
            ${inputs.exclude_low_value} -- Input is set to false
        AND sales < 10  -- Apply this condition
    )
```

<DocTab>
    <div slot='preview'>
        <div>
            <Checkbox
                title="Exclude low values" 
                name=exclude_low_value
            />
        </div>

        <BigValue fmt=num0 value=records_count data={orders}/>
    </div>

````markdown
```sql orders
select 
    COUNT(*) as records_count
from needful_things.orders
WHERE  not ${inputs.exclude_low_value} -- When True, Do not evaluate the next condition
    OR ( 
            ${inputs.exclude_low_value} -- Input is set to false
        AND sales < 10  -- Apply this condition
    )
```

<Checkbox
    title="Exclude low values" 
    name=exclude_low_value
/>

<BigValue fmt=num0 value=records_count data={orders}/>
````
</DocTab>




# Checkbox

## Options

<PropListing 
    name="name"
    required
>

Name of the checkbox, used to reference the selected value elsewhere as `{inputs.name.value}`

</PropListing>
<PropListing 
    name="defaultValue"
    options="boolean"
    defaultValue=false
>

Value to use when checkbox is first loaded. True value for checked, false for unchecked

</PropListing>






