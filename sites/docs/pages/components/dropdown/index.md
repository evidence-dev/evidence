---
title: Dropdown
sidebar_position: 1
---

Creates a dropdown menu with a list of options that can be selected. The selected option can be used to filter queries or in markdown.

To see how to filter a query using a dropdown, see [Filters](/core-concepts/filters).

```sql categories
select distinct category as category_name, upper(left(category, 3)) as abbrev from needful_things.orders
```

<DocTab>
    <div slot='preview'>
        <Dropdown data={categories} name=category1 value=category_name title="Select a Category" defaultValue="Sinister Toys"/>

        Selected: {inputs.category1.value}
    </div>

````markdown
<Dropdown 
    data={categories} 
    name=category1 
    value=category_name 
    title="Select a Category" 
    defaultValue="Sinister Toys"
/>

Selected: {inputs.category1.value}
````
</DocTab>

## Examples

### Dropdown using Options from a Query

<DocTab>
    <div slot='preview'>
        <Dropdown data={categories} name=category2 value=category_name/>
        
        Selected: {inputs.category2.value}
    </div>

````markdown
<Dropdown 
    data={categories} 
    name=category2 
    value=category_name 
/>
````

Selected: {inputs.category2.value}
</DocTab>

### With a Title

<DocTab>
    <div slot='preview'>
        <Dropdown data={categories} name=category3 value=category_name title="Select a Category" defaultValue="Sinister Toys"/>
        
        Selected: {inputs.category3.value}
    </div>

````markdown
<Dropdown 
    data={categories} 
    name=category3 
    value=category_name 
    title="Select a Category" 
    defaultValue="Sinister Toys"
/>

Selected: {inputs.category3.value}
````

</DocTab>

### With a Default Value


<DocTab>
    <div slot='preview'>
        <Dropdown
            data={categories} 
            name=category4
            value=category_name
            title="Select a Category"
            defaultValue="Odd Equipment"
        />

        Selected: {inputs.category4.value}
    </div>

````markdown
<Dropdown
    data={categories} 
    name=category4
    value=category_name
    title="Select a Category"
    defaultValue="Odd Equipment"
/>

Selected: {inputs.category4.value}
````
</DocTab>


### With Hardcoded Options

<DocTab>
    <div slot='preview'>
        <Dropdown name=hardcoded>
            <DropdownOption valueLabel="Option One" value="1" />
            <DropdownOption valueLabel="Option Two" value="2" />
            <DropdownOption valueLabel="Option Three" value="3" />
        </Dropdown>
        
        Selected: {inputs.hardcoded.value}
    </div>

````markdown
<Dropdown name=hardcoded>
    <DropdownOption valueLabel="Option One" value="1" />
    <DropdownOption valueLabel="Option Two" value="2" />
    <DropdownOption valueLabel="Option Three" value="3" />
</Dropdown>

Selected: {inputs.hardcoded.value}
````
</DocTab>

### Alternative Labels

This example uses a column called `abbrev`, which contains an alternate label for each category

<DocTab>
    <div slot='preview'>
        <Dropdown
            data={categories} 
            name=category_abbrev
            value=category_name
            label=abbrev
        />

        Selected: {inputs.category_abbrev.value}
    </div>

````markdown
<Dropdown
    data={categories} 
    name=category_abbrev
    value=category_name
    label=abbrev
/>
````

Selected: {inputs.category_abbrev.value}
</DocTab>


### Multi-Select

When using multi-select dropdowns, you need to use an alternative SQL expression:

`where column_name IN ${inputs.my_input.value}`

- Note: The use of the IN operator
- No single quotes used around the `${}`

<DocTab>
    <div slot='preview'>
        <Dropdown
            data={categories} 
            name=category_multi
            value=category_name
            multiple=true
        />
        
        Selected: {inputs.category_multi.value}
    </div>

````markdown
<Dropdown
    data={categories} 
    name=category_multi
    value=category_name
    multiple=true
/>

Selected: {inputs.category_multi.value}
````
</DocTab>




### Filtering a Query


```sql order_history
select id, order_datetime, category, item, sales  from needful_things.orders
limit 100
```

Starting with this table of orders:

<DocTab>
    <div slot='preview'>
        <DataTable data={order_history}/>
    </div>

````markdown
```sql order_history
select id, order_datetime, category, item, sales  from needful_things.orders
limit 100
```

<DataTable data={order_history}/>
````
</DocTab>

Use this input to filter the results:

```sql orders_filtered
select * from ${order_history}
where category in ${inputs.category.value}
```

<DocTab>
    <div slot='preview'>
        <Dropdown
            data={categories} 
            name=category
            value=category_name
            multiple=true
            defaultValue={['Sinister Toys']}
        />

        Filtered Row Count: {orders_filtered.length}

        <DataTable data={orders_filtered}/>
    </div>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
/>

```sql filtered_query
select *
from source_name.table
where column_name like '${inputs.name_of_dropdown.value}'
```

Filtered Row Count: {orders_filtered.length}

<DataTable data={orders_filtered}/>
````
</DocTab>


### Multiple defaultValues

<DocTab>
    <div slot='preview'>
        <Dropdown
            data={categories} 
            name=category_multi_default
            value=category_name
            multiple=true
            defaultValue={['Sinister Toys', 'Mysterious Apparel']}
        />

        Selected: {inputs.category_multi_default.value}
    </div>

````svelte
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    multiple=true
	defaultValue={['Sinister Toys', 'Mysterious Apparel']}
/>

Selected: {inputs.category_multi_default.value}
````
</DocTab>

### Select all by Default Value with Multiple

Select and return all values in the dropdown list, requires "multiple" prop.

<DocTab>
    <div slot='preview'>
        <Dropdown
            data={categories} 
            name=category_multi_selectAllByDefault
            value=category_name
            title="Select a Category"
            multiple=true
            selectAllByDefault=true
        />

        Selected: {inputs.category_multi_selectAllByDefault.value}
    </div>

````markdown
<Dropdown
    data={categories} 
    name=category_multi_selectAllByDefault
    value=category_name
    title="Select a Category"
    multiple=true
    selectAllByDefault=true
/>

Selected: {inputs.category_multi_selectAllByDefault.value}
````
</DocTab>

# Dropdown

## Options

<PropListing 
    name="name"
    description="Name of the dropdown, used to reference the selected value elsewhere as {`{inputs.name.value}`}"
    required
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
    name="multiple"
    description="Enables multi-select which returns a list"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="defaultValue"
    description="Value to use when the dropdown is first loaded. Must be one of the options in the dropdown. Arrays supported for multi-select."
    options="value from dropdown | array of values e.g. {`{['Value 1', 'Value 2']}`}"
/>
<PropListing 
    name="selectAllByDefault"
    description="Selects and returns all values, multiple property required"
    options={['true', 'false']}
    defaultValue="false"
/>
<PropListing 
    name="noDefault"
    description="Stops any default from being selected. Overrides any set `defaultValue`."
    options="boolean"
    defaultValue="false"
/>
<PropListing 
    name="disableSelectAll"
    description="Removes the `Select all` button. Recommended for large datasets."
    options="boolean"
    defaultValue="false"
/>
<PropListing 
    name="label"
    description="Column name from the query containing labels to display instead of the values (e.g., you may want to have the drop-down use `customer_id` as the value, but show `customer_name` to your users)"
    options="column name"
    defaultValue="Uses the column in value"
/>
<PropListing 
    name="title"
    description="Title to display above the dropdown"
    options="string"
/>
<PropListing 
    name="order"
    description="Column to sort options by, with optional ordering keyword"
    options="column name [ asc | desc ]"
    defaultValue="Ascending based on dropdown value (or label, if specified)"
/>
<PropListing 
    name="where"
    description="SQL where fragment to filter options by (e.g., where sales > 40000)"
    options="SQL where clause"
/>
<PropListing 
    name="hideDuringPrint"
    description="Hide the component when the report is printed"
    options={["true", "false"]}
    defaultValue="true"
/>

# DropdownOption

## Options

The DropdownOption component can be used to manually add options to a dropdown. This is useful to add a default option, or to add options that are not in a query.

<PropListing 
    name="value"
    description="Value to use when the option is selected"
    required
/>
<PropListing 
    name="valueLabel"
    description="Label to display for the option in the dropdown"
    defaultValue="Uses the value"
/>
