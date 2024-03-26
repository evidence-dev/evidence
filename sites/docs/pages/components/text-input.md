---
title: Text Input
sidebar_position: 1
---

Creates a text input that can be used to filter or search

To see how to filter a query using a text input, see [Filters](/core-concepts/filters).

<img src="/img/text-input.png" alt="TextInput" width="300px"/>

````markdown
<TextInput
    name=name_of_input
    title="Search"
/>
````

## Examples

## Basic Text Input

<img src="/img/text-input-basic.png" alt="TextInput" width="300px"/>

````markdown
<TextInput
    name=name_of_input
/>
````

## With Title

<img src="/img/text-input.png" alt="TextInput" width="300px"/>

````markdown
<TextInput
    name=name_of_input
    title="Search"
/>
````

## With Placeholder

<img src="/img/text-input-placeholder.png" alt="TextInput" width="300px"/>

````markdown
<TextInput
    name=name_of_input
    title="Freetext Search"
    placeholder="Start typing"
/>
````

## With Default Text Prefilled

<img src="/img/text-input-default.png" alt="TextInput" width="300px"/>

````markdown
<TextInput
    name=name_of_input
    title="Default Selected"
    defaultValue="Sporting"
/>
````




## Fuzzy Finding (Searching)


`TextInput` provides an easy-to-use shortcut for [fuzzy finding](https://duckdb.org/docs/sql/functions/char#text-similarity-functions). Note that this is different than `LIKE`, as it does not require a direct substring, and is useful in situtations where spelling may be unknown, like names.

You can reference it by using the syntax `{inputs.your_input_name.search('column_name')}`, and it returns a number between 0 and 1.

### Usage

Assuming you had some TextInput `first_name_search`:

```sql
SELECT * FROM users
ORDER BY {inputs.first_name_search.search('first_name')}
LIMIT 10 -- Optionally limit to only show the 10 closest results
```

becomes

```sql
SELECT * FROM users
ORDER BY damerau_levenshtein(first_name, '{inputs.first_name_search}')
LIMIT 10 -- Optionally limit to only show the 10 closest results
```

## TextInput

### Options

<table>						 
    <tr>	
        <th class='tleft'>Name</th>	
        <th class='tleft'>Description</th>	
        <th>Required?</th>	
        <th>Options</th>	
        <th>Default</th>	
    </tr>
    <tr>	
        <td>name</td>	
        <td>Name of the text input, used to reference the selected value elsewhere as {'{'}inputs.name{'}'}</td>	
        <td class='tcenter'>Yes</td>	
        <td class='tcenter'>-</td>	
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>title</td>	
        <td>Title displayed above the text input</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>-</td>
    </tr>
    <tr>	
        <td>placeholder</td>	
        <td>Alternative placeholder text displayed in the text input</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>-</td>
        <td class='tcenter'>Type to search</td>
    </tr>
    <tr>	
        <td>hideDuringPrint</td>
        <td>Hide the component when the report is printed</td>
        <td class='tcenter'>No</td>
        <td class='tcenter'>true | false</td>
        <td class='tcenter'>true</td>
    </tr>
</table>