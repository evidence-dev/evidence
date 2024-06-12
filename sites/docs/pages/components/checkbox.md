---
title: Checkbox
sidebar_position: 1
---

Creates a checkbox with toggleable input. The Title and Name attributes can be defined, enabling the passing of true and false values. 


<Checkbox
    title="Hide Months 0" 
    name=hide_months_0
/>



````markdown
<Checkbox
    title="Hide Months 0" 
    name=hide_months_0 
/>
````

### Checkbox using Default Value

Defining the defaultValue property will set the initial checked value with true and false.

<!-- <img src="/img/" alt="checkbox" width="300"/> -->

<Checkbox
    title="Title of checkbox" 
    name=name_of_checkbox
    defaultValue=true
/>

Selected Value: {inputs.name_of_checkbox}

```markdown
<Checkbox
    title="Title of checkbox" 
    name=name_of_checkbox
    defaultValue=true
/>
```

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

<div>
    <Checkbox
        title="Exclude low values" 
        name=exclude_low_value
    />
</div>



<BigValue fmt=num0 value=records_count data={orders}/>

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






