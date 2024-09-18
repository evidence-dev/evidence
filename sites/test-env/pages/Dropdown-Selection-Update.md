# Repro

<Dropdown 
  name=selected_store_segmentation 
  data={store_segmentation} 
  value=store_type
  title="Store Type"
  multiple= true
  selectAllByDefault=true
/>


<Dropdown 
  name=selected_chain_by_product
  data={available_chains} 
  value=parent_store
  title="Store Chain"
  multiple= true
  selectAllByDefault=true
/>

```sql store_segmentation
WITH stores_data AS (
    SELECT 'Olé' AS parent_store, 'KAN' AS store_type
    UNION ALL
    SELECT 'La Sirena', 'KAN'
    UNION ALL
    SELECT 'Supermercado', 'EXP' 
    UNION ALL
    SELECT 'MiniMarket', 'EXP'
    UNION ALL
    SELECT 'CornerShop', 'LOC'
    UNION ALL
    SELECT 'QuickBuy', 'LOC'
    UNION ALL
    SELECT 'BigBox', 'Cash and Carry'
    UNION ALL
    SELECT 'WholesaleMart', 'Cash and Carry'
    UNION ALL
    SELECT 'StoreOne', 'OTRAS'
    UNION ALL
    SELECT 'StoreTwo', 'OTRAS'
    UNION ALL
    SELECT 'ShopA', 'SMI'
    UNION ALL
    SELECT 'ShopB', 'SMI'
)
SELECT DISTINCT store_type
FROM stores_data
```

```sql available_chains
WITH stores_data AS (
    SELECT 'Olé' AS parent_store, 'KAN' AS store_type
    UNION ALL
    SELECT 'La Sirena', 'KAN'
    UNION ALL
    SELECT 'Supermercado', 'EXP' 
    UNION ALL
    SELECT 'MiniMarket', 'EXP'
    UNION ALL
    SELECT 'CornerShop', 'LOC'
    UNION ALL
    SELECT 'QuickBuy', 'LOC'
    UNION ALL
    SELECT 'BigBox', 'Cash and Carry'
    UNION ALL
    SELECT 'WholesaleMart', 'Cash and Carry'
    UNION ALL
    SELECT 'StoreOne', 'OTRAS'
    UNION ALL
    SELECT 'StoreTwo', 'OTRAS'
    UNION ALL
    SELECT 'ShopA', 'SMI'
    UNION ALL
    SELECT 'ShopB', 'SMI'
)

SELECT DISTINCT parent_store
FROM stores_data
WHERE upper(store_type) IN ${inputs.selected_store_segmentation.value}
```


<DataTable data={store_segmentation} />
<DataTable data={available_chains} />