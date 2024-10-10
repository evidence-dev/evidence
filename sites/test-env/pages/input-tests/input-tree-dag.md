```sql root
SELECT distinct category from orders;
```

<ButtonGroup data={root} value=category name="selectedCategory" />

```sql category_zipcodes
SELECT DISTINCT 
    zipcode
FROM orders
WHERE category = '${inputs.selectedCategory.value}'
```


<Dropdown data={category_zipcodes} value=zipcode name=selectedZipcode />