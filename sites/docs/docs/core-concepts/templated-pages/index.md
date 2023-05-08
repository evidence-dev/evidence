---
title: Templated Pages
description: Use a single file as a template for many pages with different data.
---

Templated pages allow you to use a single markdown file as a template for many pages with different data. For example:

1. `customers/[customer].md` -> One page per customer
1. `countries/[country]/index.md` -> One page per country
1. `weekly-reports/week-[week_num].md` -> One page per time period
1. `categories/[category]/[product].md` -> One page per product [nested](#nesting-templated-pages) in its category

In example 1 above, www.example.com/customers/acme would display information for Acme, while www.example.com/customers/contoso would display information for Contoso.

## Declaring a templated page

A templated page is created by adding square brackets round a file name `[parameter_name].md` or folder name `[parameter_name]`.
The following are equivalent:

- `pages/customers/[customer].md`
- `pages/customers/[customer]/index.md`

The file name in the square brackets becomes a parameter you can reference in the page, with the parameter value as text that replaces the parameter name in the URL.
In the above example, you could create a file that looks like this.

```bash
pages/
`-- customers/
    `-- [customer].md
```

The contents of `[customer].md` would be displayed if you navigate to www.yoursite.com/customers/acme or www.yoursite.com/customers/contoso.

## Using page parameters

The parameter passed in the URL can be used to filter for a value in a query result (e.g. a specific customer). This parameter can then be referenced in the page, for example to filter queries and present only data relevant to the parameter value.

A parameter on the page `[customer].md` is accessed through the variable:

```js
{
	$page.params.customer;
}
```

You can apply a filter to a query result by appending this code to the query name. This is a standard JavaScript method for filtering data.

```js title="Filter method"
.filter(d => d.customer_name === $page.params.customer)
```

This means that the code will look in the query result `d` and include only those rows where the `customer_name` is equal to the page's parameter variable.

Adding this to a `<Value/>` component:

```js
<Value
    data={customers.filter(d => d.customer_name === $page.params.customer)}
    column=sales_usd
/>
```

:::tip
If filtering lots of components, you can create a new object containing the filtered data and use that instead.

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

## Populating templated pages

So far, we've created the template for a set of pages, but haven't specified what specific pages to create, or to put it another way, what values we want the parameter to take.

For a page to exist, there must be links to it somewhere in your project.

Whilst you could add markdown style links for each parameter value, it is easier to programmatically generate them. Two easy options are:

### 1. With a `<DataTable/>` and the `link` prop

Create a link per row in the SQL query and pass it to the `<DataTable/>`.

````markdown
```sql customers
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
