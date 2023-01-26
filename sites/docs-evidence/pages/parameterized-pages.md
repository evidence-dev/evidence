---
sidebar_position: 2
hide_table_of_contents: false
title: Parameterized Pages
---

# Parameterized Pages

Sometimes you want to produce pages that all follow a similar format, but display similar information. This can be helpful, for example, to let users "drill down" into data.

For example, you might want to display a page for each customer in your company, which displays the same information, but filtered for a specific company. www.yoursite.com/customers/acme would display information for Acme, while www.yoursite.com/customers/contoso would display information for Contoso.

## Creating a parameterized page
**A parameterized page is created by adding square brackets round a file name `[parameter_name].md` or folder name `[parameter_name]` .** The parameter name is the text inside the square bracket, and the parameter value is the text that replaces the parameter name in the URL.
In the above example, you could create a file that looks like this.
```shell
pages/ 
`-- customers/
    `-- [customer].md
```
The contents of `[customer].md` would be displayed if you navigate to www.yoursite.com/customers/acme or www.yoursite.com/customers/contoso.

You can also create folders with parameters, useful when nesting inside parameterized pages:
```shell
pages/ 
`-- customers/
    `-- [customer]/
        |-- index.md
        `-- [branch].md
```
Now `index.md` would be rendered if you navigate to www.yoursite.com/customers/acme, and `[branch].md` would be rendered if you navigate to www.yoursite.com/customers/acme/south.

## Using parameters in pages


A parameter is included in a URL for a page to reference a specific item in a dataset (e.g., a department, region, product, etc.). This parameter can then be used to filter queries and present data specific to the item in the parameter.



A parameter on the page `[parameter_name].md` can be accessed through this variable:
```markdown
{$page.params.parameter_name}
```

You can apply a filter to a dataset by appending this code to the dataset name. This is a standard JavaScript method for filtering data. We plan to make this simpler in the future.

```html title="Filter method"
.filter(d => d.your_column === $page.params.parameter_name)
```
This means that the code will look in the dataset `d` and include only those rows where the your_column column is equal to the page's parameter variable.

Adding this to a normal `<Value/>` component gives us the following:

```html
<Value 
    data={your_query_name.filter(d => d.your_column_name === $page.params.parameter_name)} 
    column=your_column_name
/>
```