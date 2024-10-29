# Date Ranges

## Manual min/max dates

<DocTab>
    <div slot='preview'>
      <DateRange start="2022-01-02" end="2023-05-07" />
    </div>

````markdown
<DateRange start="2022-01-02" end="2023-05-07" />
````
</DocTab>

## Universal SQL min/max dates

```orders
select * from orders limit 1000
```

<DocTab>
    <div slot='preview'>
      <DateRange data={orders} dates="order_datetime" name="order_range" />
    </div>

````markdown
<DateRange data={orders} dates="order_datetime" name="order_range" />
````
</DocTab>

```range_of_orders
select * from orders where order_datetime between '${inputs.order_range.start}' and '${inputs.order_range.end}'
limit 1000
```

<DataTable data={range_of_orders} />

## With string table

<DateRange data="orders" dates="order_datetime" name="order_range_2" />

```range_of_orders_2
select * from orders where order_datetime between '${inputs.order_range_2.start}' and '${inputs.order_range_2.end}'
limit 1000
```

<DataTable data={range_of_orders_2} />
