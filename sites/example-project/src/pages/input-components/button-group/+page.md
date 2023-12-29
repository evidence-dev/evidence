---
queries:
- categories.sql
---

# Button Group

## From a Query

<ButtonGroup data={categories} name=category_name value=category />

{inputs.category_name}

## Hardcoded Options

<ButtonGroup name=option_name>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>  

{inputs.option_name}

## Both From a Query and Hardcoded Options

<ButtonGroup data={categories} name=category_name_with_extras value=category>
    <ButtonGroupItem valueLabel="All Categories" value="%" />
    <ButtonGroupItem valueLabel="Other" value="Other" />
</ButtonGroup>

{inputs.category_name_with_extras}

## Using a Preset `preset=dates`

<ButtonGroup name=preset_input value=category preset=dates />

{inputs.preset_input}

## Setting a Default Value `defaultValue=1`

<ButtonGroup name=default_value_input defaultValue=1>
    <ButtonGroupItem valueLabel="Option One" value=1 />
    <ButtonGroupItem valueLabel="Option Two" value=2 />
    <ButtonGroupItem valueLabel="Option Three" value=3 />
</ButtonGroup>

{inputs.default_value_input}