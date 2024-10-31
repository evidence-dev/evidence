<Slider title="Random Threshold" name="randy" defaultValue="50" min="0" max="100" step="1" />

```all_orders
SELECT *, '/orders/' || id as link FROM orders LIMIT 20
```

```total
SELECT SUM(sales) as total FROM orders WHERE 100 * random() < ${inputs.randy}
```

<BigValue data={total} value="total" title="Total Sales" />

<DataTable data={all_orders} link="link" />
