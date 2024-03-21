---
queries:
- categories.sql
---

# Button Group

## From a Query

<ButtonGroup data={categories} name=first_category_name value=category />

{inputs.first_category_name}

## With Title

<ButtonGroup 
    data={categories} 
    name=second_category_name 
    value=category
    title="Select a Category"
/>

{inputs.second_category_name}

## Hardcoded Options

<ButtonGroup name=option_name>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" default />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>  

{inputs.option_name}


## With a Default Value

<ButtonGroup data={categories} name=category_name_with_extras value=category title="Select a Category">
    <ButtonGroupItem valueLabel="All Categories" value="%" default/>
</ButtonGroup>

{inputs.category_name_with_extras}

## Using a Preset `preset=dates`

<ButtonGroup name=preset_input value=category preset=dates />

{inputs.preset_input}

## Setting a Default Value `defaultValue=1`

<ButtonGroup name=default_value_input>
    <ButtonGroupItem valueLabel="Option One" value=1 default/>
    <ButtonGroupItem valueLabel="Option Two" value=2 />
    <ButtonGroupItem valueLabel="Option Three" value=3 />
</ButtonGroup>

{inputs.default_value_input}

## Using Alternative Labels

```sql category_lookup
select 
    category, 
    upper(left(category,3)) as abbrev 
from ${categories}
```

<ButtonGroup 
    data={category_lookup} 
    name=alternative_labels 
    value=category
    label=abbrev 
/>

{inputs.alternative_labels}
