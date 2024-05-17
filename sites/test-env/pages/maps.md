# Maps

```sql la_zip_sales
select * from la_zip_sales
```

```sql la_locations
select * from la_locations
```

<AreaMap title="Area Map" data={la_zip_sales} geoId=ZCTA5CE10 areaCol=zip_code value=sales/>

<PointMap title="Point Map" data={la_locations} lat=lat long=long/>

<BubbleMap title="Bubble Map" data={la_locations} lat=lat long=long size=sales/>