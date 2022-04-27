---
sidebar_position: 9
---

# Add Parameterized Pages
Parameterized pages allow you to programmatically create webpages using your data. 

Evidence takes a parameter you supply through a URL and uses it to populate a template markdown file, allowing you to create one page that can display data for many objects.

In our example, we are going to create parameterized pages for products, so you can display data for any product from our list on its own page without having to create unique files.

## Set up a product directory 
Create a `product` folder in `pages/` and create the two .md files shown below:

```folder {5,6}
pages /
|-- index.md
|-- business-performance.md
`-- product /
   |-- [product].md
   `-- index.md
```

* Square brackets indicate a parameterized template file
* You can navigate to [localhost:3000/product](http://localhost:3000/product) to test the new URL (but you will need content in the directory for anything to be displayed)
* If a valid parameter is supplied in the URL, Evidence will run the template file and populate it based on the parameter
* If no parameter is specified in the URL, Evidence will use `index.md` if it is in the directory

## Add the code below to [product].md
We'll explain how this code works in a minute - for now, paste this into your file to get it working.

````markdown title="pages/product/[product].md"
# {$page.params.product}

```monthly_item_sales
select
order_month,
item,
count(*) as units_sold

from orders
group by order_month,item
```

```item_sales_by_price
select 
item,
sales as price_usd,
count(sales) as units_sold
from orders

group by item, price_usd
```

<BarChart 
    title='Orders per week'
    data={data.monthly_item_sales.filter(d => d.item === $page.params.product)} 
    x=order_month 
    y=units_sold
/>

<AreaChart
    title='Price Distribution of Sales'
    data={data.item_sales_by_price.filter(d => d.item === $page.params.product)} 
    x=price_usd
    y=units_sold
    xAxisTitle='Sales Price'
    yAxisTitle='Units Sold'
/>
````

## How the Template Code Works
### Access the Parameter
This variable accesses the parameter included in the URL:

```markdown
{$page.params.product}
```

* For example, if the URL ends in `/product/Typewriter`, this variable will show "Typewriter"
* This variable is used in the header of the template page

### Filter Queries with the Parameter
Queries are included as normal in template files, but the results are **filtered** from within Evidence components.

You can apply a filter to a dataset by appending this code to the dataset name. This is a standard JavaScript method for filtering data. We plan to make this simpler in the future.

```html title="Filter method"
.filter(d => d.item === $page.params.product)
```
This means that the code will look in the dataset `d` and include only those rows where the item column is equal to the page's parameter variable.

Adding this to a normal `<BarChart/>` component gives us the following:

```html
<BarChart 
    title='Orders per week'
    data={data.monthly_item_sales.filter(d => d.item === $page.params.product)} 
    x=order_month 
    y=units_sold
/>
```

## Follow a Product Link
Click on any of the links to visit the parameterized page for that product, which should look like this:

<div style={{textAlign: 'center'}}>

![param_page_example](/img/tutorial-img/needful-things-param-page.png)

</div>

There we have it - a page for each product, but only one underlying file. This could be used to automatically create reports for divisions within companies, analysis of specific products, or anything else. The possibilities are almost endless.

