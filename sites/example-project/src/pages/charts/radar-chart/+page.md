---
title: Radar Chart
---

```sql skills_data
select 'JavaScript' as skill, 90 as proficiency
union all select 'Python' as skill, 85 as proficiency
union all select 'SQL' as skill, 95 as proficiency
union all select 'React' as skill, 80 as proficiency
union all select 'Node.js' as skill, 75 as proficiency
union all select 'TypeScript' as skill, 70 as proficiency
```

```sql team_comparison
select 'Speed' as metric, 85 as value, 'Team A' as team
union all select 'Quality' as metric, 90 as value, 'Team A' as team
union all select 'Communication' as metric, 75 as value, 'Team A' as team
union all select 'Innovation' as metric, 80 as value, 'Team A' as team
union all select 'Reliability' as metric, 95 as value, 'Team A' as team
union all select 'Speed' as metric, 70 as value, 'Team B' as team
union all select 'Quality' as metric, 85 as value, 'Team B' as team
union all select 'Communication' as metric, 90 as value, 'Team B' as team
union all select 'Innovation' as metric, 95 as value, 'Team B' as team
union all select 'Reliability' as metric, 80 as value, 'Team B' as team
```

```sql product_ratings
select 'Design' as category, 4.5 as rating, 'Product X' as product
union all select 'Performance' as category, 4.2 as rating, 'Product X' as product
union all select 'Price' as category, 3.8 as rating, 'Product X' as product
union all select 'Support' as category, 4.0 as rating, 'Product X' as product
union all select 'Features' as category, 4.7 as rating, 'Product X' as product
union all select 'Design' as category, 3.9 as rating, 'Product Y' as product
union all select 'Performance' as category, 4.8 as rating, 'Product Y' as product
union all select 'Price' as category, 4.5 as rating, 'Product Y' as product
union all select 'Support' as category, 3.5 as rating, 'Product Y' as product
union all select 'Features' as category, 4.0 as rating, 'Product Y' as product
union all select 'Design' as category, 4.2 as rating, 'Product Z' as product
union all select 'Performance' as category, 3.5 as rating, 'Product Z' as product
union all select 'Price' as category, 4.8 as rating, 'Product Z' as product
union all select 'Support' as category, 4.6 as rating, 'Product Z' as product
union all select 'Features' as category, 3.8 as rating, 'Product Z' as product
```

Radar charts (also known as spider charts or web charts) display multivariate data on a two-dimensional chart with three or more quantitative variables represented on axes starting from the same point.

## Basic Radar Chart

A simple radar chart showing a single data series. Each axis represents a different metric, and the values are plotted as points connected by lines.

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="Developer Skills Profile"
/>

## Multi-Series Radar Chart

Compare multiple entities across the same metrics. Each series is shown with a different color and appears in the legend.

<RadarChart 
    data={team_comparison} 
    x=metric 
    y=value 
    series=team
    title="Team Performance Comparison"
/>

## Three-Way Comparison

Radar charts are excellent for comparing three or more items across multiple dimensions.

<RadarChart 
    data={product_ratings} 
    x=category 
    y=rating 
    series=product
    title="Product Comparison"
/>

## Circle Shape

By default, radar charts use a polygon shape. Set `shape="circle"` to use circular gridlines instead.

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="Circular Radar Chart"
    shape="circle"
/>

## Custom Max Value

By default, the max value for each axis is calculated as 1.1x the maximum data value. Use the `max` prop to set a fixed maximum for all axes - useful when you want consistent scaling (e.g., percentages out of 100).

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="Skills (Max: 100)"
    max=100
/>

## Fill Opacity

Control the transparency of the filled area with `fillOpacity`. Values range from 0 (transparent) to 1 (opaque).

### High Opacity (0.7)

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="High Fill Opacity"
    fillOpacity=0.7
/>

### Low Opacity (0.1)

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="Low Fill Opacity"
    fillOpacity=0.1
/>

## Line Width

Adjust the thickness of the connecting lines with `lineWidth`.

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="Thick Lines (lineWidth=4)"
    lineWidth=4
/>

## Markers

Show data point markers on the chart with `markers=true`. Customize the marker appearance with `markerShape` and `markerSize`.

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="With Markers"
    markers=true
    markerSize=10
/>

## Data Labels

Display the actual values on the chart with `labels=true`.

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="With Data Labels"
    labels=true
/>

## Custom Colors

Use `fillColor` and `lineColor` to customize the appearance of a single-series radar chart.

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="Custom Colors"
    fillColor="#10b981"
    lineColor="#059669"
    fillOpacity=0.4
/>

## Color Palette for Multi-Series

Use `colorPalette` to define custom colors for multi-series charts.

<RadarChart 
    data={team_comparison} 
    x=metric 
    y=value 
    series=team
    title="Custom Color Palette"
    colorPalette={['#ef4444', '#3b82f6']}
/>

## Combined Styling

Combine multiple styling options for a polished look.

<RadarChart 
    data={team_comparison} 
    x=metric 
    y=value 
    series=team
    title="Styled Comparison"
    shape="circle"
    fillOpacity=0.2
    lineWidth=3
    markers=true
    markerSize=8
/>

## Chart Height

Control the chart height with `chartAreaHeight`.

<RadarChart 
    data={skills_data} 
    x=skill 
    y=proficiency 
    title="Taller Chart"
    chartAreaHeight=400
/>
