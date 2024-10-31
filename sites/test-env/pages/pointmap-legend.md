```grouped_locations2
SELECT 
  *, 
  CASE 
		WHEN id BETWEEN 0 AND 4 THEN 1
		WHEN id BETWEEN 5 AND 9 THEN 2
		WHEN id BETWEEN 10 AND 14 THEN 3
		WHEN id BETWEEN 15 AND 19 THEN 4
		WHEN id BETWEEN 20 AND 24 THEN 5
		WHEN id BETWEEN 25 AND 29 THEN 6
		WHEN id BETWEEN 30 AND 34 THEN 7
  END AS legend_id
FROM la_locations
```	
  
  <PointMap
		showLegend={true}
		legendPosition="bottomLeft"
		data={grouped_locations2}
		lat="lat"
		long="long"
		value="legend_id"
		colorPalette={['green', 'blue', 'red', 'yellow', 'purple', 'orange', 'pink', 'brown']}
		tooltipType="hover"
		tooltip={[
			{ id: 'point_name', showColumnName: false, valueClass: 'text-lg font-semibold' },
			{ id: 'sales', fmt: 'usd', fieldClass: 'text-[grey]', valueClass: 'text-[green]' }
		]}
	/>