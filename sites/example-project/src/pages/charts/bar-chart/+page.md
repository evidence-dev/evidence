<script>
let countries = [{"country":"Canada","value":60,"year":1990},{"country":"Canada","value":83,"year":1991},{"country":"Canada","value":95,"year":1992},{"country":"Canada","value":-182,"year":1993},{"country":"Canada","value":87,"year":1994},{"country":"Canada","value":103,"year":1995},{"country":"Canada","value":111,"year":1996},{"country":"US","value":-41,"year":1990},{"country":"US","value":47,"year":1991},{"country":"US","value":70,"year":1992},{"country":"US","value":65,"year":1993},{"country":"US","value":80,"year":1994},{"country":"US","value":90,"year":1995},{"country":"US","value":125,"year":1996},{"country":"UK","value":61,"year":1990},{"country":"UK","value":63,"year":1991},{"country":"UK","value":68,"year":1992},{"country":"UK","value":73,"year":1993},{"country":"UK","value":80,"year":1994},{"country":"UK","value":83,"year":1995},{"country":"UK","value":85,"year":1996},{"country":"China","value":30,"year":1990},{"country":"China","value":33,"year":1991},{"country":"China","value":40,"year":1992},{"country":"China","value":52,"year":1993},{"country":"China","value":65,"year":1994},{"country":"China","value":78,"year":1995},{"country":"China","value":101,"year":1996}]

    let textP = [
        {dept: 'Public Works', category: 'Pothole Repair', complaints: 24105},
{dept: 'Public Works', category: 'Debris in Street', complaints: 16378},
{dept: 'Public Works', category: 'Tree Issue ROW', complaints: 14871},
{dept: 'Public Works', category: 'Obstruction in ROW', complaints: 10528},
{dept: 'Public Works', category: 'Pavement Failure', complaints: 6941},
{dept: 'Public Works', category: 'Tree Issue ROW/Emergency (PW)', complaints: 5675},
{dept: 'Public Works', category: 'Tree Issue ROW/Maintenance (PW)', complaints: 4688},
{dept: 'Public Works', category: 'Alley & Unpaved Street Maintenance', complaints: 3160},
{dept: 'Public Works', category: 'Mowing Medians', complaints: 2743},
{dept: 'Public Works', category: 'Curb/Gutter Repair', complaints: 1435},
{dept: 'Public Works', category: 'Sidewalk/Curb Ramp/Route - NEW', complaints: 1272},
{dept: 'Public Works', category: 'Street Resurfacing', complaints: 1029},
{dept: 'Public Works', category: 'School Zone - New/Review/Changes', complaints: 696},
{dept: 'Public Works', category: 'Street Resurfacing Inquiry', complaints: 611},
{dept: 'Public Works', category: 'Guardrail New/Repair', complaints: 402},
{dept: 'Public Works', category: 'Sidewalk Repair', complaints: 9206},
{dept: 'Public Works', category: 'Guardrail Repair', complaints: 357},
{dept: 'Public Works', category: 'Roadway Spillage', complaints: 323},
{dept: 'Public Works', category: 'Bridge Repair', complaints: 294},
{dept: 'Public Works', category: 'Barricade Request', complaints: 228},
{dept: 'Public Works', category: 'School Issues - Crossing Guards', complaints: 171},
{dept: 'Public Works', category: 'Bicycle Issues', complaints: 97},
{dept: 'Public Works', category: 'Road Sanding Request', complaints: 59},
{dept: 'Public Works', category: 'Fence/Wall Repair', complaints: 42},
{dept: 'Public Works', category: 'Tree Issue ROW/Maintenance (PARD)', complaints: 29},
{dept: 'Public Works', category: 'Guardrail - New', complaints: 27},
{dept: 'Public Works', category: 'Tree Issue ROW/Emergency (PARD)', complaints: 24},
{dept: 'Public Works', category: 'Fence Repair - MOPAC', complaints: 10}
]

</script>

```simple_bar
select 'North' as country, -105 as value
union all
select 'Northwest' as country, 101 as value
union all
select 'South' as country, 113 as value
union all
select 'Southeast' as country, -78 as value
union all
select 'East' as country, 112 as value
union all
select 'West' as country, 103 as value
union all
select 'Southwest' as country, 110 as value
```

```simpler_bar_unordered
select 'North' as country, 87 as value, 1994 as year
union all
select 'North' as country, 83 as value, 1991 as year
union all
select 'North' as country, 95 as value, 1992 as year
union all
select 'North' as country, 82 as value, 1993 as year
union all
select 'North' as country, 60 as value, 1990 as year
union all
select 'North' as country, 103 as value, 1995 as year
union all
select 'North' as country, 111 as value, 1996 as year
union all
select 'Southwest' as country, 41 as value, 1990 as year
union all
select 'Southwest' as country, 47 as value, 1991 as year
union all
select 'Southwest' as country, 125 as value, 1996 as year
union all
select 'Southwest' as country, 65 as value, 1994 as year
union all
select 'Southwest' as country, 80 as value, 1992 as year
union all
select 'Southwest' as country, 90 as value, 1995 as year
union all
select 'Southwest' as country, 70 as value, 1993 as year
union all
select 'East' as country, 61 as value, 1990 as year
union all
select 'East' as country, 63 as value, 1991 as year
union all
select 'East' as country, 68 as value, 1992 as year
union all
select 'East' as country, 73 as value, 1993 as year
union all
select 'East' as country, 80 as value, 1994 as year
union all
select 'East' as country, 83 as value, 1995 as year
union all
select 'East' as country, 85 as value, 1996 as year
union all
select 'South' as country, 30 as value, 1990 as year
union all
select 'South' as country, 33 as value, 1991 as year
union all
select 'South' as country, 40 as value, 1992 as year
union all
select 'South' as country, 52 as value, 1993 as year
union all
select 'South' as country, 65 as value, 1994 as year
union all
select 'South' as country, 78 as value, 1995 as year
union all
select 'South' as country, 101 as value, 1996 as year
```

## Bar

<BarChart 
    data={simple_bar} 
    x=country 
    y=value 
    xAxisTitle=Region
/>

## Stacked Bar

<BarChart 
    data={simpler_bar_unordered} 
    x=year 
    y=value 
    series=country
/>

### Stacked Bar with Negative Values

<BarChart data={countries} x=year y=value series=country/>

## Grouped Bar

<BarChart 
    data={simpler_bar_unordered} 
    x=year 
    y=value 
    series=country 
    type=grouped
/>

### Grouped Bar with Negative Values

<BarChart data={countries} x=year y=value series=country type=grouped/>

## Horizontal Bar

<BarChart 
    data={simple_bar}
    x=country 
    y=value 
    xAxisTitle=Country 
    swapXY=true
/>

## Horizontal Stacked Bar

<BarChart 
    data={simpler_bar_unordered} 
    swapXY=true 
    x=year 
    y=value 
    series=country 
    xType=category 
    sort=false
/>

<BarChart data={countries} x=year y=value series=country swapXY=true xType=category/>

## Horizontal Grouped Bar

<BarChart 
    data={simpler_bar_unordered} 
    swapXY=true 
    x=year 
    y=value 
    series=country 
    type=grouped 
    xType=category
/>

## Long Bar Chart

<BarChart data={textP} x=category y=complaints swapXY=true sort=true/>
