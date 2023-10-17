---
sidebar_position: 8
title: Box Plot
hide_table_of_contents: false
---

<img src="/img/boxplot-basic.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>
```

## Data Structure
The BoxPlot component requires pre-aggregated data, with one row per box you would like to display. There are 2 ways to pass in the values needed to construct the box:

**1. Explicitly define each value (e.g., `min`, `intervalBottom`, `midpoint`, `intervalTop`, `max`)**

| name | intervalBottom | midpoint | intervalTop |
| -------- | -------- | -------- | -------- |
|    Experiment A     |    0.02     |    0.04     |    0.08     |
|    Experiment B     |    -0.01     |    0.01    |    0.02    |

This example table excludes whiskers which would be defined with `min` and `max` columns

**2. Define a `midpoint` and a `confidenceInterval` - this will add the interval to the midpoint to get the max, and subtract to get the min**

| name | midpoint | confidenceInterval |
| -------- | -------- | -------- |
|    Experiment A     |    0.04     |    0.03    |
|    Experiment B     |    0.01     |    0.04    |


## Examples

### Basic Box Plot

<img src="/img/boxplot-basic.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>
```

### Horizontal Box Plot

<img src="/img/boxplot-horiz.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
    swapXY=true
    yFmt='+0.0%;-0.0%;0'
/>
```

### Box Plot with Whiskers

<img src="/img/boxplot-whiskers.png" width="700"/>

```markdown
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    min=min
    max=max
    confidenceInterval=confidence
    yFmt='+0.0%;-0.0%;0'
/>
```

### Box Plot with Custom Colors

<img src="/img/boxplot-color.png" width="700"/>

```markdown
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
```

## Options

### Data

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>data</td>	<td>Query name, wrapped in curly braces</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>query name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>name</td>	<td>Column to use for the names of each box in your plot</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>min</td>	<td>Column containing minimum values, appearing as whisker</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>intervalBottom</td>	<td>Column containing values for bottom of box</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>midpoint</td>	<td>Column containing values for midpoint of box</td>	<td class='tcenter'>Yes</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>intervalTop</td>	<td>Column containing values for top of box</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>max</td>	<td>Column containing maximum values, appearing as whisker</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>confidenceInterval</td>	<td>Column containing value to use in place of intervalBottom and intervalTop. Is subtracted from midpoint to get the bottom and added to midpoint to get the top</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Formatting & Styling

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>color</td>	<td>Column containing color strings</td>	<td class='tcenter'>-</td>	<td class='tcenter'>column name</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yFmt</td>	<td>Format to use for y column (<a href='/core-concepts/formatting'>see available formats</a>)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>Excel-style format | buil-in format name | custom format name</td>	<td class='tcenter'>-</td>	</tr>
</table>

### Axes
<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>swapXY</td>	<td>Swap the x and y axes to create a horizontal chart</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xAxisTitle</td>	<td>Name to show under x-axis. If 'true', formatted column name is used. Only works with swapXY=false</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | string | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yAxisTitle</td>	<td>Name to show beside y-axis. If 'true', formatted column name is used.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | string | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xGridlines</td>	<td>Turns on/off gridlines extending from x-axis tick marks (vertical lines when swapXY=false)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yGridlines</td>	<td>Turns on/off gridlines extending from y-axis tick marks (horizontal lines when swapXY=false)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>xAxisLabels</td>	<td>Turns on/off value labels on the x-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>yAxisLabels</td>	<td>Turns on/off value labels on the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>xBaseline</td>	<td>Turns on/off thick axis line (line appears at y=0)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>true</td>	</tr>
<tr>	<td>yBaseline</td>	<td>Turns on/off thick axis line (line appears directly alongside the y-axis labels)</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>xTickMarks</td>	<td>Turns on/off tick marks for each of the x-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yTickMarks</td>	<td>Turns on/off tick marks for each of the y-axis labels</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true | false</td>	<td class='tcenter'>false</td>	</tr>
<tr>	<td>yMin</td>	<td>Starting value for the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>yMax</td>	<td>Maximum value for the y-axis</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>showAllXAxisLabels</td>	<td>Force every x-axis value to be shown. This can truncate labels if there are too many.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>true|false</td>	<td class='tcenter'>false</td>	</tr></table>


### Chart

<table>						 
<tr>	<th class='tleft'>Name</th>	<th class='tleft'>Description</th>	<th>Required?</th>	<th>Options</th>	<th>Default</th>	</tr>
<tr>	<td>title</td>	<td>Chart title. Appears at top left of chart.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>subtitle</td>	<td>Chart subtitle. Appears just under title.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>string</td>	<td class='tcenter'>-</td>	</tr>
<tr>	<td>chartAreaHeight</td>	<td>Minimum height of the chart area (excl. header and footer) in pixels. Adjusting the height affects all viewport sizes and may impact the mobile UX.</td>	<td class='tcenter'>-</td>	<td class='tcenter'>number</td>	<td class='tcenter'>180</td>	</tr>
</table>

## Annotations

Box plots can include [**annotations**](/components/annotations) using the `ReferenceLine` and `ReferenceArea` components. These components are used within a chart component like so:

```html
<BoxPlot 
    data={box}
    name=experiment
    midpoint=value
    confidenceInterval=confidence
>
    <ReferenceLine y=0.04 label='Target'/>
</BoxPlot>
```