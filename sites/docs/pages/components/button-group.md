---
title: Button Group
sidebar_position: 1
queries:
- categories.sql
---

Creates a group of single-select buttons for quick filtering

To see how to filter a query using a Button Group, see [Filters](/core-concepts/filters).

<ButtonGroup 
    data={categories} 
    name=selected_category 
    value=category
/>

Selected: {inputs.selected_category}

```markdown
<ButtonGroup 
    data={categories} 
    name=selected_category 
    value=category
/>

Selected: {inputs.selected_category}
```

## Examples

### Button Group using Options from a Query

<ButtonGroup 
    data={categories} 
    name=category_picker 
    value=category
/>

Selected: {inputs.category_picker}

```markdown
<ButtonGroup 
    data={categories} 
    name=category_picker 
    value=category
/>

Selected: {inputs.category_picker}
```

### With a Title

<ButtonGroup 
    data={categories} 
    name=category_selector 
    value=category
    title="Select a Category"
/>

Selected: {inputs.category_selector}

```markdown
<ButtonGroup 
    data={categories} 
    name=category_selector 
    value=category
    title="Select a Category"
/>

Selected: {inputs.category_selector}
```

### With a Default Value

<ButtonGroup
    data={categories}
    name=selected_button1
    value=category
    defaultValue="Cursed Sporting Goods"
/>

Selected: {inputs.selected_button1}

````markdown
<ButtonGroup
    data={categories}
    name=selected_button1
    value=category
    defaultValue="Cursed Sporting Goods"
/>
````


### With Hardcoded Options

<ButtonGroup name=hardcoded_options>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>

Selected: {inputs.hardcoded_options}


````markdown
<ButtonGroup name=hardcoded_options>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>

Selected: {inputs.hardcoded_options}
````


### With Hardcoded Options and Default Value

<ButtonGroup name=hardcoded_options_default>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" default />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>

Selected: {inputs.hardcoded_options_default}


````markdown
<ButtonGroup name=hardcoded_options_default>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" default />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>

Selected: {inputs.hardcoded_options_default}
````




### Alternative Labels

<ButtonGroup
    data={categories} 
    name=alternative_labels_selector
    value=category
    label=short_category
/>

Selected: {inputs.alternative_labels_selector}


````markdown
<ButtonGroup
    data={categories} 
    name=alternative_labels_selector
    value=category
    label=short_category
/>

Selected: {inputs.alternative_labels_selector}
````

### Filtering a Query

<ButtonGroup
    data={categories} 
    name=category_button_group
    value=category
/>

```sql filtered_query
select 
    category, item, sum(sales) as total_sales
from needful_things.orders
where category like '${inputs.category_button_group}'
group by all
```

<DataTable data={filtered_query} emptySet=pass emptyMessage="No category selected"/>


````markdown
<ButtonGroup
    data={categories} 
    name=category_button_group
    value=category
/>

```sql filtered_query
select 
    category, item, sum(sales) as total_sales
from needful_things.orders
where category like '${inputs.category_button_group}'
group by all
```

<DataTable data={filtered_query} emptySet=pass emptyMessage="No category selected"/>
````

### Style Buttons as Tabs

<ButtonGroup 
    data={categories} 
    name=buttons_as_tabs
    value=category
    display=tabs
/>

Selected: {inputs.buttons_as_tabs}

```markdown
<ButtonGroup 
    data={categories} 
    name=buttons_as_tabs 
    value=category
    display=tabs
/>

Selected: {inputs.buttons_as_tabs}
```

### Style Buttons as Tabs: With Hardcoded Options

<ButtonGroup name=button_tabs_hardcoded_options display=tabs>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>

Selected: {inputs.button_tabs_hardcoded_options}


````markdown
<ButtonGroup name=button_tabs_hardcoded_options display=tabs>
    <ButtonGroupItem valueLabel="Option One" value="1" />
    <ButtonGroupItem valueLabel="Option Two" value="2" />
    <ButtonGroupItem valueLabel="Option Three" value="3" />
</ButtonGroup>

Selected: {inputs.button_tabs_hardcoded_options}
````


# ButtonGroup

## Options

<PropListing 
    name="name"
    description="Name of the button group, used to reference the selected value elsewhere as {`{inputs.name}`}"
    required=true
/>
<PropListing 
    name="preset"
    description="Preset values to use"
    options="dates"
/>
<PropListing 
    name="data"
    description="Query name, wrapped in curly braces"
    options="query name"
/>
<PropListing 
    name="value"
    description="Column name from the query containing values to pick from"
    options="column name"
/>
<PropListing 
    name="label"
    description="Column name from the query containing labels to display instead of the values (e.g., you may want to have the drop-down use `customer_id` as the value, but show `customer_name` to your users)"
    options="column name"
    defaultValue="Uses the column in value"
/>
<PropListing 
    name="title"
    description="Title to display above the button group"
    options="string"
/>
<PropListing 
    name="defaultValue"
    description="Sets initial active button and current value"
    options="value from button group, e.g. 'Cursed Sporting Goods'"
/>
<PropListing 
    name="order"
    description="Column to sort options by"
    options="column name"
    defaultValue="Uses the same order as the query in `data`"
/>
<PropListing 
    name="where"
    description="SQL where fragment to filter options by (e.g., where sales > 40000)"
    options="SQL where clause"
/>
<PropListing 
    name="display"
    description="Displays tabs with button functionality"
    options={['tabs', 'buttons']}
    defaultValue="buttons"
/>

# ButtonGroupItem

The ButtonGroupItem component can be used to manually add options to a button group. This is useful if you want to add a default option, or if you want to add options that are not in a query.

## Options

<PropListing 
    name="value"
    description="Value to use when the option is selected"
    required=true
/>
<PropListing 
    name="valueLabel"
    description="Label to display for the option in the dropdown"
    options="string"
    defaultValue="Uses value"
/>
<PropListing 
    name="default"
    description="Sets the option as the default"
    options={["true", "false"]}
    defaultValue="false"
/>
<PropListing 
    name="hideDuringPrint"
    description="Hide the component when the report is printed"
    options={["true", "false"]}
    defaultValue=true
/>
