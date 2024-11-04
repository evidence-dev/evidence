---
title: Text Input
sidebar_position: 1
---

Creates a text input that can be used to filter or search

To see how to filter a query using a text input, see [Filters](/core-concepts/filters).

<TextInput
    name=text_input_name
    title="Search"
/>

Selected: {inputs.text_input_name}

````markdown
<TextInput
    name=name_of_input
    title="Search"
/>
````

## Examples

### Basic Text Input

<TextInput
    name=name_of_input
/>

Selected: {inputs.name_of_input}

````markdown
<TextInput
    name=name_of_input
/>
````

### With Title

<TextInput
    name=text_input2
    title="Search"
/>

Selected: {inputs.text_input2}

````markdown
<TextInput
    name=name_of_input
    title="Search"
/>
````

### With Placeholder

<TextInput
    name=text_input3
    title="Freetext Search"
    placeholder="Start typing"
/>

Selected: {inputs.text_input3}

````markdown
<TextInput
    name=name_of_input
    title="Freetext Search"
    placeholder="Start typing"
/>
````

### With Default Text Prefilled

<TextInput
    name=text_input4
    title="Default Selected"
    defaultValue="Sporting"
/>

Selected: {inputs.text_input4}

````markdown
<TextInput
    name=name_of_input
    title="Default Selected"
    defaultValue="Sporting"
/>
````

### Fuzzy Finding (Searching)


`TextInput` provides an easy-to-use shortcut for [fuzzy finding](https://duckdb.org/docs/sql/functions/char#text-similarity-functions). Note that this is different than `LIKE`, as it does not require a direct substring, and is useful in situtations where spelling may be unknown, like names.

You can reference it by using the syntax `{inputs.your_input_name.search('column_name')}`, and it returns a number between 0 and 1.

## Usage

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

## Options

<PropListing 
    name="name"
    required
    options=string
>

Name of the text input, used to reference the selected value elsewhere as `{inputs.name.value}`

</PropListing>
<PropListing 
    name="title"
    options=string
>

Title displayed above the text input

</PropListing>
<PropListing 
    name="placeholder"
    options=string
    defaultValue="Type to search"
>

Alternative placeholder text displayed in the text input

</PropListing>
<PropListing 
    name="hideDuringPrint"
    options={['true', 'false']}
    defaultValue="true"
>

Hide the component when the report is printed

</PropListing>