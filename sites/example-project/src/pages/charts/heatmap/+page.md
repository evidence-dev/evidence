# Heatmap

```missing
select 'A' as cat, 'Mon' as day_name, 1 as day_num, 100 as sales union all
select 'A' as cat, 'Thu' as day_name, 4 as day_num, 200 as sales union all
select 'A' as cat, 'Sat' as day_name, 6 as day_num, 400 as sales union all
select 'A' as cat, 'Tue' as day_name, 2 as day_num, 300 as sales union all
select 'A' as cat, 'Wed' as day_name, 3 as day_num, 200 as sales union all
select 'A' as cat, 'Fri' as day_name, 5 as day_num, 500 as sales union all
select 'B' as cat, 'Mon' as day_name, 1 as day_num, 700 as sales union all
select 'B' as cat, 'Thu' as day_name, 4 as day_num, 200 as sales union all
select 'B' as cat, 'Sat' as day_name, 6 as day_num, 400 as sales union all
select 'B' as cat, 'Tue' as day_name, 2 as day_num, 100 as sales union all
select 'B' as cat, 'Wed' as day_name, 3 as day_num, 700 as sales union all
select 'B' as cat, 'Fri' as day_name, 5 as day_num, 400 as sales union all
select 'B' as cat, 'Sun' as day_name, 0 as day_num, 300 as sales
```

<Heatmap
    data={missing}
    x=day_name
    y=cat
    value=sales
    xSort=day_num
/>

```orders
select category, dayname(order_datetime) as day, dayofweek(order_datetime) as day_num, count(*) as order_count from needful_things.orders
group by all
order by category, day_num  
```

```bigger
select * from ${orders}
union all
select concat(category,'_x') as category, day, day_num, order_count from ${orders}
union all
select concat(category,'_w') as category, day, day_num, order_count from ${orders}
```


Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 


<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    valueFmt=usd 
    colorPalette={['rgb(254,234,159)','rgb(218,66,41)']}
    legend=true
    mobileValueLabels=true
    borders=true
/>

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 

<Heatmap 
    data={orders} 
    x=day 
    y=category 
    value=order_count 
    colorPalette={['white', 'green']}
    title="Weekday Orders"
    subtitle="By Category"
/>

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 


```test_data
select 'Mon' as day, 'ABC' as category, 100 as value
union all
select 'Tue' as day, 'ABC' as category, 120 as value
union all
select 'Wed' as day, 'ABC' as category, 130 as value
union all
select 'Mon' as day, 'DEF' as category, 160 as value
union all
select 'Tue' as day, 'DEF' as category, 180 as value
union all
select 'Wed' as day, 'DEF' as category, 190 as value
```

<Heatmap data={test_data} x=day y=category value=value/>
<Heatmap data={test_data} x=day y=category value=value colorPalette={['rgb(254,234,159)','rgb(218,66,41)']}/>

        
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.


```item_channel
select item, channel, count(1) as orders from needful_things.orders
group by all
```

<Heatmap data={item_channel} x=channel y=item value=orders/>

```item_month
select item, monthname(order_datetime) as month, count(1) as orders from needful_things.orders
group by all
```

<Heatmap data={item_month} x=month y=item value=orders valueLabels=true borders=false colorPalette={['white', 'purple']}/>


```item_state
select item, state, count(1) as orders from needful_things.orders
group by all
order by state asc, item asc
```

<Heatmap 
    data={item_state} 
    x=item 
    y=state 
    value=orders 
    xLabelRotation=-45
    colorPalette={['white', 'maroon']} 
    title="Item Sales"
    subtitle="By State"
    rightPadding=40
    cellHeight=25
    nullsZero=false
/>
