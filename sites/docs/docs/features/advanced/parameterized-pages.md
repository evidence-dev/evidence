---
sidebar_position: 4
hide_table_of_contents: false
title: Parameterized Pages
---

A parameter is included in a URL for a page to reference a specific item in a dataset (e.g., a department, region, product, etc.). This parameter can then be used to filter queries and present data specific to the item in the parameter.

A page's parameter can be accessed through this variable:
```markdown
{$page.params.your_parameter_name}
```

You can apply a filter to a dataset by appending this code to the dataset name. This is a standard JavaScript method for filtering data. We plan to make this simpler in the future.

```html title="Filter method"
.filter(d => d.your_column === $page.params.your_parameter_name)
```
This means that the code will look in the dataset `d` and include only those rows where the your_column column is equal to the page's parameter variable.

Adding this to a normal `<Value/>` component gives us the following:

```html
<Value 
    data={data.your_query_name.filter(d => d.your_column_name === $page.params.your_parameter_name)} 
    column=your_column_name
/>
```