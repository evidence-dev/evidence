<TextInput name="myInput" />

- Raw Input: {inputs.myInput}
- Value: {inputs.myInput.value}
- Label: {inputs.myInput.label}


```sql myQuery
SELECT 
    ${inputs.myInput} as sqlSnippetForm,
    '${inputs.myInput.value}' as valueReferenceForm
```

<ButtonGroup name="justAButtonGroup">
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>

<ButtonGroup name="queryWithDataGroup" data=orders value=zipcode defaultValue={64114}/>

```sql zipcodes
SELECT DISTINCT zipcode FROM orders
```

<ButtonGroup name="queryWithQueryInput" data={zipcodes} value=zipcode defaultValue={64114}/>


```sql buttonGroupQuery
SELECT ${inputs.queryWithDataGroup}
```


```sql combined
SELECT 
    *
FROM ${buttonGroupQuery}
CROSS JOIN
    ${myQuery}
```


<Slider name="slideyBoy"/>
<!-- TODO: Slider somehow breaks all the lines when used in a Query -->



<!-- {inputs.slideyBoy} -->

```sql queryName
SELECT ${inputs.slideyBoy} 
```


<Checkbox name="Check" title="MyCheckBox"/>

{inputs.Check}