```orders_summary
select * from needful_things.orders
limit 100
```

<DocTab>
    <div slot='preview'>
        <DataTable data={orders_summary}/>
    </div>

```svelte
<DataTable data={orders_summary}/>
```
</DocTab>