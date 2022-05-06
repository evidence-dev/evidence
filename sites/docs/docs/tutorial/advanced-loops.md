---
sidebar_position: 8
title: "Advanced: Loops"
---

Needful Things have asked us where they should spend their marketing dollars.

To best allocate marketing dollars, you often look for the cheapest channel to acquire customers, the lowest Cost Per Acquisition (CPA) channel:

$$

CPA=\frac {Spend \space on \space marketing \space channel} {\# \space New \space orders \space from \space channel}

$$

Luckily, each Needful Things customer order is attributed to a marketing channel, and customers only seem to buy once, so this should be quite easy.

Let's create a new file in the `pages/` directory called `marketing-performance.md` to explore this.

## Create queries to loop through

First we'll create a chart to see which channels customers come from.

Secondly, to compare the CPA, we'll need to join the data from the `marketing_spend` table. We can join on the `channel_month` field in each table, (which concatenates the `channel`, and `order_month` fields).


````markdown title="Paste into marketing-performance.md:"
# Marketing Performance

## Orders by Channel

```orders_by_channel
select 
channel,
order_month,
channel_month,
count(*) as orders

from orders
group by channel, order_month
order by orders
```

<AreaChart
    data={data.orders_by_channel}
    x=order_month
    y=orders
    series=channel
/>

## Channel CPA
```channel_cpa
select 
marketing_channel,
sum(spend) as total_spend,
sum(orders) as total_orders,
sum(spend) / sum(orders) as cpa

from marketing_spend
left join ${orders_by_channel} using(channel_month)

group by marketing_channel
order by cpa
```
````
You may notice that we use a `${...}` in our second query. This syntax allows us to reference the result of another query on the same page.

Your page should now look like this

<div style={{textAlign: 'center'}}>

![marketing-queries](/img/tutorial-img/needful-things-marketing-queries.png)

</div>



Now we'll use the `channel_cpa` query to demonstrate how to loop through a dataset. 

## Set up the Loop

Loops are achieved through an **`each block`**.

Let's use an each block to list the names of all the channel.

```json title="Add to bottom of marketing-performance.md:"
{#each data.channel_cpa as channel}

{channel.marketing_channel}

{/each}
```
#### How does this work? 
In the each block, we're passing in the query name `data.channel_cpa` and giving it an "alias" of `channel` to reference inside the each block. You **must** alias the query in the each block.

The each block loops through every row of the table and displays whatever is included in the middle of the block. In this case, we're displaying the `marketing_channel` column of the `channel` dataset.

<div style={{textAlign: 'center'}}>

![items-list](/img/tutorial-img/needful-things-first-loop.png)

</div>

## Add data for each channel
Now we're going to add the CPA, spend and orders for each channel.

We'll use a `<Value/>` component for this. You could do this with a bare reference as we did with the item name, but that would not allow us to format the value as a currency.

When used inside an **each block**, the `<Value/>` component only requires a reference to the column it needs to display.

```json {3} title="Change the highlighted line below:"
{#each data.channel_cpa as channel}

**{channel.marketing_channel} CPA was <Value value={channel.cpa} fmt=usd/>**, with a spend of <Value value={channel.total_spend} fmt=usd/>, bringing in <Value value={channel.total_orders}/> orders.

{/each}
```
<div style={{textAlign: 'center'}}>

![items-values](/img/tutorial-img/needful-things-loop-finished.png)

</div>

Great - now we have our data, and Needful Things can see which channel to spend more money on - the one with the lowest CPA!