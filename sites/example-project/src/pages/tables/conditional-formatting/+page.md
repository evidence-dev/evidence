# Conditional Formatting

```numbers
 select 'A' as name, 1 as number
 union all
 select 'B',2
union all
 select 'C',3
 union all
 select 'D',4
 union all
 select 'E',5
 union all
 select 'F',6
 union all
 select 'G',7
 union all
 select 'H',8
 union all
 select 'I',9
 union all
 select 'J',10
 order by number asc
 ```

```negatives
select 'A' as name, -5 as number,0 as status
union all
select 'B', -4 as number, 1 as status
union all
select 'C', -3 as number, 2 as status
union all
select 'D', -2 as number,0
union all
select 'E', -1 as number,1
union all
select 'F', 0 as number,1
union all
select 'G', 1 as number,2
union all
select 'H', 2 as number,2
union all
select 'I', 3 as number,0
union all
select 'J', 4 as number,0
union all
select 'K', 5 as number,2
union all
select 'L', 6 as number,1
union all
select 'M', 7 as number,2
union all
select 'N', 8 as number,1
union all
select 'O', 9 as number,0
union all
select 'P', 10 as number,0
union all
select 'Q', 11 as number,1
union all
select 'R', 12 as number,1
union all
select 'S', 13 as number,1
union all
select 'T', 14 as number,1
order by number asc
```

### Diverging Scale

<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale colorScale={['#6db678','white','#ce5050']}/>
</DataTable>


<DataTable data={negatives} rows=all>
  <Column id=name/>
  <Column id=number contentType=colorscale colorScale={['#ce5050','white','#6db678']}
  colorMid=0/>
</DataTable>

### Heatmap

<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale colorScale={['#6db678','#ebbb38','#ce5050']}/>
</DataTable>


<DataTable data={numbers}>
  <Column id=name/>
  <Column id=number contentType=colorscale colorScale={['#fff761','#5ba84c','#171566']}/>
</DataTable>


## Using Another Column

```numbers_othercol
 select 'A' as name, 1 as number, 2 as scale_defining_number, 'usd' as fmt
 union all
 select 'B',2,10,'eur'
union all
 select 'C',3,30,'num0'
 union all
 select 'D',4,20,'pct'
 union all
 select 'E',5,10,'usd'
 union all
 select 'F',6,5,'pct'
 union all
 select 'G',7,1,'pct'
 union all
 select 'H',8,44,'eur'
 union all
 select 'I',9,4,'#,##0.00"kg"'
 union all
 select 'J',10,55, 'usd'
 order by number asc
 ```


 <DataTable data={numbers_othercol}>
  <Column id=name/>
  <Column id=scale_defining_number fontColor={['green','red']}/>
  <Column id=number contentType=colorscale colorScale={['#6db678','white','#ce5050']} scaleColumn=scale_defining_number fmtCol=fmt/>
</DataTable>


<DataTable data={negatives}>
  <Column id=name/>
  <Column id=status/>
  <Column id=number contentType=colorscale colorScale={['maroon','green','navy']} scaleColumn=status/>
</DataTable>

<DataTable data={negatives}>
  <Column id=name/>
  <Column id=number contentType=colorscale colorScale={['maroon','green','navy']}  scaleColumn=status/>
</DataTable>

## Negatives in Red

<DataTable data={negatives}>
  <Column id=name/>
  <Column id=number redNegatives=true/>
</DataTable>