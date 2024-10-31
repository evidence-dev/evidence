---
title: Templated Pages
description: Use a single file as a template for many pages with different data.
sidebar_position: 10
---

Templated pages allow you to use a single markdown file as a template for many pages with different data. For example:

1. `customers/[customer].md` -> One page per customer
1. `countries/[country].md` -> One page per country
1. `weekly-reports/week-[week_num].md` -> One page per time period
1. `categories/[category]/[product].md` -> One page per product [nested](#nesting-templated-pages) in its category

In example 1 above, www.example.com/customers/acme would display information for Acme, while www.example.com/customers/contoso would display information for Contoso.

A useful reference can be found in the [Needful Things example app](https://github.com/evidence-dev/demo/tree/main/pages/operations/pick_lists).


## Quickstart: VS Code Extension

1. **Create a [SQL file query](/core-concepts/queries/#sql-file-queries) in your queries folder**. It should return:
   - **One row per page** you want to generate
   - **A column containing a unique name or id** for each page
   - **Other columns containing data you want** to use in the pages
2. **Run `Evidence: Create Templated Pages from Query`** in the the Command Palette (Ctrl/Cmd+Shift+P).
3. **Enter the column name that contains your unique id** into the box that appears.

Evidence will automatically create a templated page that changes for each unique id, and an index page containing links for each page.

E.g. if your query was called `customers.sql` and contained a unique column called `customer` then the following files would be created:

```code title="Example Files Created"
pages/
`-- customers/
    |-- [customer].md
    `-- index.md
```

This serves as a helpful starting point, and you will likely want to customize the code in the newly created files.

## Full Guide of Concepts

### Declaring a templated page

A templated page is created by adding square brackets round a file name `[parameter_name].md` or folder name `[parameter_name]`.
The following are equivalent:

- `pages/customers/[customer].md`
- `pages/customers/[customer]/index.md`

The string inside the square brackets becomes a [parameter](#using-page-parameters) you can reference in the page, with the parameter value as text that replaces the parameter name in the URL.

### Using page parameters

The parameter passed in the URL can be used in the page. For example, if the URL is `/customers/acme`, the parameter value is `acme`, and you access it in markdown as follows:

```javascript
{params.customer}
```

Parameters can be used in queries to filter query results (e.g. a for specific customer)

````sql
```sql customers
select
    sum(sales) as sales_usd 
from needful_things.orders
where first_name = '${params.customer}'
group by 1
```
````


Adding this to a `<Value/>` component:

```javascript
<Value
    data={customers}
    column=sales_usd
/>
```


### Generating templated pages

So far, we've created the template for a set of pages, but haven't specified what specific pages to create, or to put it another way, what values we want the parameter to take.

For a page to be built, there must be links to it somewhere in your app.

Whilst you could add markdown style links for each parameter value, it is easier to programmatically generate them. Two easy options are:



#### 1. With a `<DataTable/>` and the `link` prop

Create a link per row in the SQL query and pass it to the `<DataTable/>`.

````markdown
```sql customers
select
    customer_name,
    '/customers/' || customer_name as customer_link,
    sum(sales) as sales_usd
from needful_things.orders
group by 1
```

<DataTable
    data={customers}
    link=customer_link
/>
````

#### 2. With an `{#each}` loop

````markdown
```sql customers
select
    customer_name,
    sum(sales) as sales_usd
from needful_things.orders
group by 1
```

{#each customers as customer}

- [{customer.customer_name}](/customers/{customer.customer_name})

{/each}
````

### Nesting templated pages

Creating folders with parameters can be useful when nesting inside templated pages:

```
pages/
`-- customers/
    `-- [customer]/
        |-- index.md
        `-- [branch].md
```

Now `index.md` would be rendered if you navigate to www.example.com/customers/acme, and `[branch].md` would be rendered if you navigate to www.example.com/customers/acme/south.

## Complete Example Code

See a complete example using a table to generate a templated page for each customer.

`index.md`

````markdown
# Customers

```sql customers
select
    first_name,
    '/customers/' || first_name as customer_link,
    sum(sales) as sales_usd 
from needful_things.orders
group by 1
```

<DataTable
    data={customers}
    link=customer_link
/>
````

`customers/[customer].md`

````markdown
# {params.customer}

```sql customers
select
    sum(sales) as sales_usd 
from needful_things.orders
where first_name = '${params.customer}'
group by 1
```

{params.customer} bought items worth <Value data={customers} column=sales_usd />.
````

