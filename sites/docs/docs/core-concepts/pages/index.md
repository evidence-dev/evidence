---
sidebar_position: 1
title: Pages
description: Evidence renders markdown files into web pages. 
---

Evidence renders markdown files into web pages. Markdown files are stored in the `/pages` directory.

When developing, pages are rendered at `localhost:3000`. Evidence will instantly reload pages when you edit and save their markdown files.

Evidence is a static site generator, meaning that when you run `npm run build` it builds static HTML pages from those markdown files. If you [deploy your project](../../deployment/), this is how the site your users see is generated.

## Basic Navigation

Evidence uses a **file based routing system**, meaning that the URL where user can access the page is determined by the path to the markdown file in the `/pages` directory:

- `pages/index.md` is the homepage
- `pages/weekly-sales.md` creates the `/weekly-sales` page
- `pages/marketing/attribution.md` creates the `/marketing/attribution` page
- `pages/customers/[customer].md` creates a page for each customer using the `[customer].md` template. See [templated pages](#templated-pages) for details.

This allows you to organize your pages in a way that makes sense for your users, for example:

- by department
- by product
- by customer
- by time period


## Templated Pages

Templated pages allow you to use a single markdown file as a template for many pages with different data. For example:
- `/customers/[customer].md` -> One page per customer
- `/products/[products].md` -> One page per product
- `/countries/[country].md` -> One page per region
- `/weekly-reports/week-[week_num].md` -> One page per time period

In the first example above, www.yoursite.com/customers/acme would display information for Acme, while www.yoursite.com/customers/contoso would display information for Contoso.

### Creating a templated page
A templated page is created by adding square brackets round a file name `[parameter_name].md` or folder name `[parameter_name]`.
The following are equivalent:
- `pages/customers/[customer].md`
- `pages/customers/[customer]/index.md`

The parameter name is the text inside the square bracket, and the parameter value is the text that replaces the parameter name in the URL.
In the above example, you could create a file that looks like this.
```
pages/ 
`-- customers/
    `-- [customer].md
```
The contents of `[customer].md` would be displayed if you navigate to www.yoursite.com/customers/acme or www.yoursite.com/customers/contoso.



### Creating navigation links

To determine what pages to build, Evidence crawls your markdown files, and looks for URLs. Templated pages are only generated if there is a link to them (at least one) of your markdown files.

Since you typically want to create many pages from a single template, it is useful to programmatically generate these links. Two easy options are:

1. Using a `<DataTable/>` with the `link` prop

````markdown
```customers
select
    customer_name,
    'customers/' || customer_name as customer_link,
    sum(sales) as sales_usd
from orders
group by 1
```

<DataTable
    data={customers}
    link=customer_link
/>
````


2. Using a `{#each}` loop
````markdown
```customers
select
    customer_name,
    sum(sales) as sales_usd
from orders
group by 1
```

{#each customers as customer}

- [{customer.customer_name}](/customers/{customer.customer_name})

{/each}
````


### Using page parameters

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


### Nesting templated pages

You can also create folders with parameters, useful when nesting inside templated pages:
```
pages/ 
`-- customers/
    `-- [customer]/
        |-- index.md
        `-- [branch].md
```
Now `index.md` would be rendered if you navigate to www.yoursite.com/customers/acme, and `[branch].md` would be rendered if you navigate to www.yoursite.com/customers/acme/south.