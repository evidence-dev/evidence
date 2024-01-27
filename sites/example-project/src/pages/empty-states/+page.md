# Empty Component States

```empty_query
select 1 as num
where num > 1
```

## Value

### `emptySet=error` (default)
<Value data={empty_query} emptySet=error/>

### `emptySet=warn`
<Value data={empty_query} emptySet=warn/>

### `emptySet=pass`
<Value data={empty_query} emptySet=pass/>

## BigValue

### `emptySet=error` (default)
<BigValue data={empty_query} value=num emptySet=error/>

### `emptySet=warn`
<BigValue data={empty_query} value=num emptySet=warn/>

### `emptySet=pass`
<BigValue data={empty_query} value=num emptySet=pass/>

## Chart

### `emptySet=error` (default)
<LineChart data={empty_query} emptySet=error/>

### `emptySet=warn`
<LineChart data={empty_query} emptySet=warn/>

### `emptySet=pass`
<LineChart data={empty_query} emptySet=pass/>



## DataTable

### `emptySet=error` (default)
<DataTable data={empty_query} emptySet=error/>

### `emptySet=warn`
<DataTable data={empty_query} emptySet=warn/>

### `emptySet=pass`
<DataTable data={empty_query} emptySet=pass/>

## Filter Example

```filter_query
select 'a' as category, 100 as num
union all 
select 'b' as category, 200 as num
union all 
select 'c' as category, 300 as num
union all 
select 'd' as category, 400 as num
```

<Dropdown name=number>
    <DropdownOption value=0/>
    <DropdownOption value=100/>
    <DropdownOption value=200/>
    <DropdownOption value=300/>
    <DropdownOption value=400/>
    <DropdownOption value=500/>
</Dropdown>

```filtered
select * from ${filter_query}
where num >= '${inputs.number}'
```

<DataTable data={filtered} emptySet=warn/>