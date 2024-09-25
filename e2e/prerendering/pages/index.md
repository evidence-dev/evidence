---
title: Welcome to Evidence
---

```sql orders
SELECT * FROM orders
```

```sql QueryWithInputs
SELECT 1

/*
    ButtonGroupManualDefault: {{${inputs.ButtonGroupManualDefault}}} ($.)

    Checkbox: {{${inputs.Checkbox}}} ($.)
    CheckboxDefault: {{${inputs.CheckboxDefault}}} ($.)

    DateRangeManual: {{${inputs.DateRangeManual.start} - ${inputs.DateRangeManual.end}}} ($.start - $.end)
    DateRangeManualDefault: {{${inputs.DateRangeManualDefault.start} - ${inputs.DateRangeManualDefault.end}}} ($.start - $.end)

    DropdownManual: {{${inputs.DropdownManual.value}}} ($.value)
    DropdownManualDefault: {{${inputs.DropdownManualDefault.value}}} ($.value)

    DropdownMultiManualDefault: {{${inputs.DropdownMultiManualDefault.value}}} ($.value)

    Dropdown: {{${inputs.Dropdown.value}}} ($.value)
    DropdownDefault: {{${inputs.DropdownDefault.value}}} ($.value)

    DropdownMultiDefault: {{${inputs.DropdownMultiDefault.value}}} ($.value)

    Slide: {{${inputs.Slide}}} ($.)
    SlideDefault: {{${inputs.SlideDefault}}} ($.)

    TextDefault: {{${inputs.TextDefault}}} ($.)

*/
```

<Grid cols=2>

<div class="col-span-2"> Button Group (Manual) </div>

<ButtonGroup name="ButtonGroupManual">
    <ButtonGroupItem value="FirstValue" valueLabel="FirstLabel" />
    <ButtonGroupItem value="SecondValue" valueLabel="SecondLabel" />
</ButtonGroup>

<ButtonGroup name="ButtonGroupManualDefault">
    <ButtonGroupItem value="FirstValue" valueLabel="FirstLabel" />
    <ButtonGroupItem value="SecondValue" valueLabel="SecondLabel" default />
</ButtonGroup>

<div class="col-span-2"> Checkbox </div>
<Checkbox name="Checkbox" />
<Checkbox name="CheckboxDefault" defaultValue=true />

<div class="col-span-2"> DateRange (Manual) </div>
<DateRange name="DateRangeManual" />
<DateRange name="DateRangeManualDefault" defaultValue='Last 7 Days' />

<div class="col-span-2"> Dropdown (Manual) </div>
<Dropdown name="DropdownManual">
    <DropdownOption value="FirstValue" valueLabel="FirstLabel" />
    <DropdownOption value="SecondValue" valueLabel="SecondLabel" />
</Dropdown>

<Dropdown name="DropdownManualDefault" defaultValue="SecondValue">
    <DropdownOption value="FirstValue" valueLabel="FirstLabel" />
    <DropdownOption value="SecondValue" valueLabel="SecondLabel" />
</Dropdown>

<div class="col-span-2"> Dropdown (Multi) (Manual) </div>
<Dropdown name="DropdownMultiManual" multiple>
    <DropdownOption value="FirstValue" valueLabel="FirstLabel" />
    <DropdownOption value="SecondValue" valueLabel="SecondLabel" />
</Dropdown>

<Dropdown name="DropdownMultiManualDefault" multiple defaultValue="SecondValue">
    <DropdownOption value="FirstValue" valueLabel="FirstLabel" />
    <DropdownOption value="SecondValue" valueLabel="SecondLabel" />
</Dropdown>

<div class="col-span-2"> Dropdown </div>
<Dropdown name="Dropdown" value="category" data={orders}/>

<Dropdown name="DropdownDefault" defaultValue="Mysterious Apparel" value="category" data={orders}/>

<div class="col-span-2"> Dropdown (Multi)</div>
<Dropdown name="DropdownMulti" multiple value="category" data={orders}/>

<Dropdown name="DropdownMultiDefault" multiple defaultValue="Mysterious Apparel" value="category" data={orders}/>

<div class="col-span-2"> DimensionGrid</div>
<div class="col-span-2">
<DimensionGrid data={orders} name="DimensionGrid"/>
</div>

<div class="col-span-2"> Slider</div>
<Slider name="Slide" />

<Slider name="SlideDefault" defaultValue=5 />

<div class="col-span-2"> Text</div>
<TextInput name="Text" />

<TextInput name="TextDefault" defaultValue="This is a default value" />

</Grid>

<pre id="InputStoreState">
{JSON.stringify(inputs, null, 2)}
</pre>
<pre id="QueryWithInputs">
{QueryWithInputs.originalText}
</pre>
<pre id="QueryWithInputs">
{__QueryWithInputsText}
</pre>
<pre>

LENGTH:
{QueryWithInputs.length}
HASH:
{QueryWithInputs.hash}
COLUMNS:
{JSON.stringify(QueryWithInputs.columns,null,2)}

</pre>
