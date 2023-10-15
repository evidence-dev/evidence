# Box Plot

```box
select 'Blue button' as experiment, -0.07 as min, -0.021 as value, 0.03 as max, 0.03 as confidence, '#b00b0b' as color
union all
select 'Video' as experiment, -0.09 as min, -0.03 as value, 0.03 as max,0.03 as confidence, '#0f9106' as color
union all
select 'Simpler CTA' as experiment,-0.04 as min,  0.02 as value,0.06 as max, 0.03 as confidence, '#044191' as color
union all
select 'Larger Font' as experiment, 0.02 as min, 0.06 as value, 0.11 as max,0.03 as confidence, '#0f9106' as color
```

## Box Plot
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>

## Horizontal Box Plot

<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    swapXY=true
    yFmt='+0.0%;-0.0%;0'
/>

## Box Plot with Whiskers

<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    min=min
    max=max
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>

## Box Plot with Custom Colors

<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    min=min
    max=max
    color=color
    confidenceInterval=confidence
    swapXY=true
    yFmt='+0.0%;-0.0%;0'
/>
