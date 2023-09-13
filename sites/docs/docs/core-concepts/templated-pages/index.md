---
title: Templated Pages
description: Use a single file as a template for many pages with different data.
---

Templated pages allow you to use a single markdown file as a template for many pages with different data. For example:

1. `customers/[customer].md` -> One page per customer
1. `countries/[country].md` -> One page per country
1. `weekly-reports/week-[week_num].md` -> One page per time period
1. `categories/[category]/[product].md` -> One page per product [nested](#nesting-templated-pages) in its category

In example 1 above, www.example.com/customers/acme would display information for Acme, while www.example.com/customers/contoso would display information for Contoso.

A useful reference can be found in the [Needful Things example project](https://github.com/evidence-dev/demo/tree/main/pages/operations/pick_lists).

## Declaring a templated page

A templated page is created by adding square brackets round a file name `[parameter_name].md` or folder name `[parameter_name]`.
The following are equivalent:

- `pages/customers/[customer].md`
- `pages/customers/[customer]/index.md`

The string inside the square brackets becomes a [parameter](#using-page-parameters) you can reference in the page, with the parameter value as text that replaces the parameter name in the URL.

## Using page parameters

The parameter passed in the URL can be used in the page. For example, if the URL is `/customers/acme`, the parameter value is `acme`, and you access it in markdown as follows:

```js
{$page.params.customer}
```

Parameters can be used to filter query results (e.g. a for specific customer), to present only relevant information to the page.

You can apply a filter to a query result by appending this code to the query name. This is a standard JavaScript method for filtering data.

```js title="Filter method"
.filter(d => d.customer_name === $page.params.customer)
```

This means that the code will look in the query result `d` and include only those rows where the `customer_name` is equal to the page's parameter value.

Adding this to a `<Value/>` component:

```js
<Value
    data={customers.filter(d => d.customer_name === $page.params.customer)}
    column=sales_usd
/>
```

:::tip
If filtering lots of components, you can create a new data containing the filtered data and use that instead.

```markdown
<script>
   let filtered_customers = customers.filter(d => d.customer_name === $page.params.customer)
</script>

<Value 
    data={filtered_customers} 
    column=sales_usd
/>
```

:::

## Generating templated pages

So far, we've created the template for a set of pages, but haven't specified what specific pages to create, or to put it another way, what values we want the parameter to take.

For a page to be built, there must be links to it somewhere in your project.

Whilst you could add markdown style links for each parameter value, it is easier to programmatically generate them. Two easy options are:

### 1. With a `<DataTable/>` and the `link` prop

Create a link per row in the SQL query and pass it to the `<DataTable/>`.

````markdown
```sql customers
select
    customer_name,
    '/customers/' || customer_name as customer_link,
    sum(sales) as sales_usd
from orders
group by 1
```

<DataTable
    data={customers}
    link=customer_link
/>
````

### 2. With an `{#each}` loop

````markdown
```sql customers
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

## Nesting templated pages

Creating folders with parameters can be useful when nesting inside templated pages:

```
pages/
`-- customers/
    `-- [customer]/
        |-- index.md
        `-- [branch].md
```

Now `index.md` would be rendered if you navigate to www.example.com/customers/acme, and `[branch].md` would be rendered if you navigate to www.example.com/customers/acme/south.

## Complete example

See a complete example using a table to generate a templated page for each customer.

`index.md`

````markdown
# Customers

```sql customers
select
    first_name,
    '/customers/' || first_name as customer_link,
    sum(sales) as sales_usd 
from orders
group by 1
```

<DataTable
    data={customers}
    link=customer_link
/>
````

`customers/[customer].md`

````markdown
# {$page.params.customer}

```sql customers
select
    first_name,
    sum(sales) as sales_usd 
from orders
group by 1
```

{$page.params.customer} bought items worth 
<Value data={customers.filter(d => d.first_name === $page.params.customer)} column=sales_usd />.
````

