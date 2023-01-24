<script>
import USMap from '$lib/viz/USMap.svelte'
</script>

# Maps

```map_data
select "Arkansas" as name, 100 as value
union all
select "Illinois" as name, 200 as value
union all
select "Florida" as name, 1000 as value
union all
select "New York" as name, 1110 as value
union all 
select "California" as name, 2000 as value

```

```world_map
select "Canada" as name, 260 as value
union all
select "United Kingdom" as name, 300 as value
union all
select "United States of America" as name, 500 as value
```

## US State Map

<USMap 
    data={map_data}
    useDemoData={true}
/>
