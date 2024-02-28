# Calendar Heatmap

```obd
select order_datetime::date as date, count(1) as orders
from needful_things.orders
where order_datetime <'2021-04-01'
and order_datetime > '2019-08-01'
group by all
```

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

<CalendarHeatmap 
    data={obd} 
    date=date 
    value=orders 
    filter=false
    valueFmt=usd
    title="Calendar Heatmap"
    subtitle="Daily Sales"
/>

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    yearLabel=false
/>

```oneyear
select * from ${obd}
where date between '2020-01-02' and '2020-12-31'
```

is aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Custom Color Palette

<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    colorPalette={['navy', 'lightyellow', 'purple']}
/>

<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    title="Calendar Heatmap"
    subtitle="Daily Orders"
    colorPalette={['white', 'green']}
/>

## Legend Options

### Default Legend

<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    filter=false
/>

### No Legend
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    legend=false
    filter=false
/>

### Filter Legend
<CalendarHeatmap
    data={oneyear}
    date=date
    value=orders
    filter=true
/>