---
title: Dropdown
sidebar_position: 1
---

Creates a dropdown menu with a list of options that can be selected. The selected option can be used to filter queries or in markdown.

To see how to filter a query using a dropdown, see [Filters](/core-concepts/filters).

<img src="/img/dropdown-title.png" alt="dropdown" width="300"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
/>
````

## Examples

### Dropdown using Options from a Query

<img src="/img/dropdown-notitle.png" alt="dropdown using a query" width="300"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
/>
````

### With a Title

<img src="/img/dropdown-title.png" alt="dropdown with title" width="300"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    title="Select a Category"
/>
````

### With a Default Value

<img src="/img/dropdown-default.png" alt="dropdown with a default" width="300"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    title="Select a Category"
>
    <DropdownOption valueLabel="All Categories" value="%" />
</Dropdown>
````

Note that "%" is a wildcard character in SQL that can be used with `where column_name like '${inputs.name_of_dropdown}'` to return all values.


### With Hardcoded Options

<img src="/img/dropdown-custom-options.png" alt="dropdown with hardcoded values" width="240"/>

````markdown
<Dropdown name=name_of_dropdown>
    <DropdownOption valueLabel="Option One" value="1" />
    <DropdownOption valueLabel="Option Two" value="2" />
    <DropdownOption valueLabel="Option Three" value="3" />
</Dropdown>
````

### Alternative Labels

<img src="/img/dropdown-alternative-label.png" alt="dropdown with alternative labels" width="300"/>


````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    label=column_name_containg_label
/>
````

### Multi-Select

<img src="/img/dropdown-multi-select.png" alt="multi-select dropdown" width="500"/>

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    multiple=true
/>

```sql filtered_query
select *
from source_name.table
where column_name in ${inputs.name_of_dropdown.value}
```
````

### Filtering a Query

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
````

### Multiple defaultValues

````markdown
<Dropdown
    data={query_name} 
    name=name_of_dropdown
    value=column_name
    multiple=true
	defaultValue={['value1', 'value2']}
/>

```sql filtered_query
select *
from source_name.table
where column_name in '${inputs.name_of_dropdown.value}'
```
````

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