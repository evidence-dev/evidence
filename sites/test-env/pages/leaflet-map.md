# Leaflet Map

```coords
select 51.51123691095239 as lat,  -0.13465819567340626 as long, 'London' as city, 'Bobs' as store_name, 44345 as annual_sales, 'SMB' as segment
union all
select 51.51153241529485 as lat, -0.13175192134263558 as long, 'London' as city, 'Bills' as store_name, 55344 as annual_sales, 'SMB' as segment
union all
select 51.51204873146856 as lat, -0.1302492157640683 as long, 'London' as city, 'The Fox and Badger' as store_name, 12342 as annual_sales, 'SMB' as segment
union all
select 51.51116547005441 as lat, -0.12908566248621936 as long, 'London' as city, 'One Day Plumbing' as store_name, 55245 as annual_sales, 'SMB' as segment
union all
select 51.51044456017838 as lat, -0.13666702083919927 as long, 'London' as city, 'Fenton Atheltic Apparel' as store_name, 63578 as annual_sales, 'SMB' as segment
```

Selected store: {inputs.store_name.store_name}

<InputMap 
    data={coords} 
    lat="lat"
    long="long"
    name="store_name"
	min="10000"
	max="70000"
	value="annual_sales"
    height=500
/>
