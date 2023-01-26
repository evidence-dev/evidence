<script>
    import ChartTile from '$lib/ChartTile.svelte';
    import { showQueries } from '@evidence-dev/components/ui/stores'
	showQueries.set(true)
</script>

# Component Reference


# SQL

<div class=gallery-container-grid>

<ChartTile chartName="Queries" chartPage="sql-query">

```orders_by_year
select 
date_part('year', order_datetime::timestamp)::string as year,
sum(sales) as sales_usd,
count(*) as orders,
(1.0*sales_usd / lag(sales_usd, 1) over (order by year)) -1 as sales_change_pct
from orders
group by 1
order by 1
```

</ChartTile>

<ChartTile chartName="Query Chaining" chartPage="query-chaining">

```this_year
select * 
from ${orders_by_year}
where year = '2021'
```

</ChartTile>

</div>

# Markdown

<div class=gallery-container-grid>

<ChartTile chartName="Markdown" chartPage="markdown">

### Markdown
You can use markdown to **format** ~~your~~ _text_. 
- And add lists
- etc   

</ChartTile>

<ChartTile chartName="Values in Text" chartPage="value" partialWidth=true>
   <p> Total sales for 2021 were <Value data={this_year} column=sales_usd />.</p>
   <br>
</ChartTile>




<ChartTile chartName="Images" chartPage="images" partialWidth=true>
   
<img src=evidence-logo.svg alt="Evidence Logo"/>

</ChartTile>

</div>


# Charts
<div class=gallery-container-grid>


<ChartTile chartName="Data Table" chartPage="data-table">
   <DataTable data={orders_by_year} />
</ChartTile>

<ChartTile chartName="Big Value" chartPage="big-value" partialWidth=true>
    <BigValue 
        data={this_year} 
        value=sales_usd
        comparison=sales_change_pct
        comparisonTitle="vs Last Year"
        row=2
    />
</ChartTile>

<ChartTile chartName="Bar Chart" chartPage="bar-chart">
    <BarChart 
        data={orders_by_year} 
        x=year
        y=sales_usd
    />
</ChartTile>

<ChartTile chartName="Line Chart" chartPage="line-chart">
    <LineChart 
        data={orders_by_year} 
        x=year
        y=sales_usd
    />
</ChartTile>

<ChartTile chartName="Area Chart" chartPage="area-chart">
    <AreaChart 
        data={orders_by_year} 
        x=year
        y=sales_usd
    />
</ChartTile>





</div>





<style>
    
    .container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    }


    .gallery-container-grid {
  display: grid;
  grid-template-columns: 50% 50%;
  grid-gap: 10px;
}

@media screen and (max-width: 500px){
  .gallery-container-grid {
    grid-template-columns: 100%;
  }
  .gallery-container-grid > h2, h3 {
    grid-column: 1 / 2;
  }
}

@media screen and (max-width: 1000px) and (min-width: 501px){
  .gallery-container-grid {
    grid-template-columns: 50% 50%;
  }
  .gallery-container-grid > h2, h3 {
    grid-column: 1 / 3;
  }
}

@media screen and (max-width: 1350px) and (min-width: 1001px){
  .gallery-container-grid {
    grid-template-columns: 100%;
  }
  .gallery-container-grid > h2, h3 {
    grid-column: 1 / 2;
  }
}

@media screen and (min-width: 1351px){
  .gallery-container-grid {
    grid-template-columns: 50% 50%;
  }
  .gallery-container-grid > h2, h3 {
    grid-column: 1 / 3;
  }
}


.gallery-container-grid > h2, h3 {
  margin-bottom: 0px;
  margin-top: 10px;
}

.gallery-container-grid > h2 {
  margin-top: 20px;
}

:global(div.chart-footer)
{
    display: none !important;
}


</style>