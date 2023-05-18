```sql simpler_bar
select 'Canada' as country, 60 as value, 1990 as year
union all
select 'Canada' as country, 83 as value, 1991 as year
union all
select 'Canada' as country, 95 as value, 1992 as year
union all
select 'Canada' as country, 182 as value, 1993 as year
union all
select 'Canada' as country, 87 as value, 1994 as year
union all
select 'Canada' as country, 103 as value, 1995 as year
union all
select 'Canada' as country, 111 as value, 1996 as year
union all
select 'US' as country, 41 as value, 1990 as year
union all
select 'US' as country, 47 as value, 1991 as year
union all
select 'US' as country, 70 as value, 1992 as year
union all
select 'US' as country, 65 as value, 1993 as year
union all
select 'US' as country, 80 as value, 1994 as year
union all
select 'US' as country, 90 as value, 1995 as year
union all
select 'US' as country, 125 as value, 1996 as year
union all
select 'UK' as country, 61 as value, 1990 as year
union all
select 'UK' as country, 63 as value, 1991 as year
union all
select 'UK' as country, 68 as value, 1992 as year
union all
select 'UK' as country, 73 as value, 1993 as year
union all
select 'UK' as country, 80 as value, 1994 as year
union all
select 'UK' as country, 83 as value, 1995 as year
union all
select 'UK' as country, 85 as value, 1996 as year
union all
select 'China' as country, 30 as value, 1990 as year
union all
select 'China' as country, 33 as value, 1991 as year
union all
select 'China' as country, 40 as value, 1992 as year
union all
select 'China' as country, 52 as value, 1993 as year
union all
select 'China' as country, 65 as value, 1994 as year
union all
select 'China' as country, 78 as value, 1995 as year
union all
select 'China' as country, 101 as value, 1996 as year
```

```sql single_values
select 1 as measure
union all
select 1 as measure
union all
select 1 as measure
union all
select 1 as measure
union all
select 1 as measure
union all
select 1 as measure
union all
select 2 as measure
union all
select 2 as measure
union all
select 2 as measure
union all
select 2 as measure
union all
select 2 as measure
union all
select 2 as measure
union all
select 3 as measure

```

## Histogram

<Histogram data={simpler_bar} x=value/>


## Histogram for Small Integers

<Histogram data={single_values} x=measure/>


## Histogram with Custom Height

<Histogram data={simpler_bar} x=value chartAreaHeight=380/>
