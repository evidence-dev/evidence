<TextInput name="myInput" />

- Raw Input: {inputs.myInput}
- Value: {inputs.myInput.value}
- Label: {inputs.myInput.label}
- Arbitrary field: ({typeof inputs.myInput.arbitrary.path.name}) {inputs.myInput.arbitrary.path.name}

{inputs.myInput.label == 'usd' ? 'Is usd' : 'Is not usd'}
{inputs.myInput == 'usd' ? 'Is usd' : 'Is not usd'}

```sql myQuery
SELECT 
    '${inputs.myInput}' as sqlSnippetForm,
    '${inputs.myInput.value}' as valueReferenceForm
```

<DataTable data={myQuery}/>




<!-- <ButtonGroup name="myGroup">
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup> -->
