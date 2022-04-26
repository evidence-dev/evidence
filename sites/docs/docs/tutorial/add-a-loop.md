---
sidebar_position: 8
---

# Add a Loop

Now we'll use the `product_performance` query to demonstrate how to loop through a dataset. 

Loops are achieved through an **`each block`**.

## Set up product loop
Let's use an each block to list the names of all the products.

```json title="Add to bottom of business-performance.md:"
Items ranked by sales are as follows:

{#each data.product_performance as prod_perf}

{prod_perf.item}

{/each}
```
#### How does this work? 
In the each block, we're passing in the query name `data.product_performance` and giving it an "alias" of `prod_perf` to reference inside the each block.

The each block loops through every row of the table and displays whatever is included in the middle of the block. In this case, we're displaying the `item` column of the `prod_perf` dataset.

<div style={{textAlign: 'center'}}>

![items-list](/img/tutorial-img/needful-things-item-list.png)

</div>

## Add value for each item
Now we're going to add the total sales for each item.

We'll use a `<Value/>` component for this. You could do this with a bare reference as we did with the item name, but that would not allow us to format the value as a currency.

When used inside an **each block**, the `<Value/>` component only requires a reference to the column it needs to display.

Let's also make this a bullet list by adding a `*` in front of our data (normal markdown syntax).

```json {3} title="Change the highlighted line below:"
{#each data.product_performance as prod_perf}

* {prod_perf.item}: <Value value={prod_perf.item_sales} fmt=usd/>

{/each}
```
<div style={{textAlign: 'center'}}>

![items-values](/img/tutorial-img/needful-things-items-values.png)

</div>

It's powerful to be able to loop through a dataset and display whatever you'd like for each row. 

What if you want to drill into each item in the list and get more information about it? That would be too much information to display in one list, wouldn't it?

The best way to contain all of that product-specific information would be to create a page for each product, showing only stats relevant to the product you select.

Let's set up a link for each product to allow our users to visit a page for whichever products they're interested in.

## Add links to product pages
You can create a link in markdown by wrapping your link label in square brackets, then putting a URL in parentheses directly after it: `[Link Label](URL)`

This code will loop through the product list and add a URL containing a product directory `/product` and the product name `{prod_perf.item}`. 

For example, the URL for the Running Shoes product would be `localhost:3000/product/Running%20Shoes`.

```markdown {3} title="Change the highlighted line below:" 
{#each data.product_performance as prod_perf}

* [{prod_perf.item}](/product/{prod_perf.item}): <Value value={prod_perf.item_sales} fmt=usd/>

{/each}
```
<div style={{textAlign: 'center'}}>

![item-links](/img/tutorial-img/needful-things-item-hyperlinks.png)

</div>

Looking good, but we have one big problem: we don't have any of these product pages built yet, so these links are going to give us errors.

## Now what?
We have 12 products in our list - are we really going to create 12 documents?

This is a common issue in analytics and reporting in large organizations: we have a lot of things to report on, but no good way to summarize all of the information while also giving users the ability to drill-down into specific areas of interest. 

BI tools claim to have this functionality, but the readers of our reports don't want to spend time clicking and dragging inside a report builder.

**With Evidence, there's a better way.** 

We can deliver all the detail of a drill-down report without a ton of work.

In the next section, we'll show you how to use **parameterized pages** to make these links work - opening up almost limitless possibilities for designing drill-down reporting.