<script>
    import { getContext } from 'svelte';
    const { data, xGet, yGet, xScale, yScale, extents, xDomain, yDomain, xRange } = getContext('LayerCake');
      
    // Styling:
    export let fillColor = "#c7c7c7";
    export let fillTransparency = 0.3;
    let fillOpacity = 1 - fillTransparency;
  
    // CALCULATE PATH FOR THE LINE
    // xScale.bandwidth is used to determine the width of columns in a chart and is used as part
    // of the scaleBand scale. To position the line points in the center of columns, 
    // we adjust the path by bandwidth/2
    // The <path> element uses a series of commands identified through letters:
    // M = move to (x,y)
    // L = draw line from current point to (x,y)
    // Z = complete the line from the current point to the original point
    $: path = 'M' + $data
      .map(d => {
        return ($xGet(d) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)) + ',' + $yGet(d);
    })
      .join('L');
  

    // CALCULATE PATH FOR THE AREA
    // This path starts at the last point in the line above, draws a line down to the X Axis,
    // then another line along the X Axis to (0,0), and finally a line back to the first point
    // in the line.


    $: last = $data[$data.length - 1];
    $: lastX = $xGet(last);


    $: first = $data[0];
    $: firstX = $xGet(first);

    let area;
    $: {
      const yRange = $yScale.range();
      area = path + (
        'L' + 
        (lastX + 
        ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)) + 
        ',' + 
        ($yScale(Math.max(0,$yDomain[0]))-0.5) +

        'L' + 
        (firstX + 
        ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)) + 
        ',' + 
        ($yScale(Math.max(0,$yDomain[0]))-0.5) +
        'Z'
      );
    }

  </script>
  
  <path 
    class='path-area' 
    d='{area}' 
    fill={fillColor}
    fill-opacity={fillOpacity}
  ></path>