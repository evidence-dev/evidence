<Dropdown from=reviews tag="select first_name || ' ' || last_name from orders where id = order_id" value=order_id name=selected_order_id where="nps_score > 7" />

```full_selected_order
select * from orders where id = '${inputs.selected_order_id}'
```

<BigValue data={inputs} value=selected_order_id />

<DataTable data={full_selected_order} />
