<script>
    import EChartsMap from './EChartsMap.svelte'
    import {colours} from '../modules/colours'

    export let data = undefined; 

    export let min = undefined;

    export let title = undefined;

    let minValue = min ?? Math.min(...data.map(d => d.value))
    let maxValue = Math.max(...data.map(d => d.value))

    let config 

    export let abbreviations = false;
    abbreviations = (abbreviations === "true" || abbreviations === true);

    let nameProperty = abbreviations ? "abbrev" : "name"

    $: config = {
        title: {
          text: title
        },
        tooltip: {
          trigger: 'item',
          showDelay: 0,
          transitionDuration: 0.2,
          confine: true,
                axisPointer: {
                    // Use axis to trigger tooltip 
                    type: "shadow", // 'shadow' as default; can also be 'line' or 'shadow'

                },
                padding: 6,
                borderRadius: 4, 
                borderWidth: 1,
                borderColor: colours.grey400,
                backgroundColor: 'white',
                extraCssText: 'box-shadow: 0 3px 6px rgba(0,0,0,.15); box-shadow: 0 2px 4px rgba(0,0,0,.12); z-index: 1;',
                textStyle: {
                    color: colours.grey900,
                    fontSize: 12,
                    fontWeight: 400
                },
                order:'valueDesc'
        },
      
        visualMap: {
          top: 'middle',
          min: minValue,
          max: maxValue,
          itemWidth: 15,
          show: false,
          inRange: {
            color: [
            //   '#313695',
            //   '#4575b4',
            //   '#74add1',
            //   '#abd9e9',
            //   '#e0f3f8',
            //   '#ffffbf',
            //   '#fee090',
            //   '#fdae61',
            //   '#f46d43',
            //   '#d73027',
            //   '#a50026',
            '#c6f5c4',
            '#a7dea4',
            '#83c480',
            '#6db369',
            '#51994d',
            '#3c8c37',
            '#2c8026',
            '#1c7016',
            '#0f610a',
            '#075202',
            ]
          },
          text: ['High', 'Low'],
          calculable: false,
          inverse: false
        },
        series: [
          {
            name: 'Value',
            type: 'map',
            zoom: 1.1,
            top: 45,
            roam: false,
            map: 'US',
            nameProperty: nameProperty,
            emphasis: {
              label: {
                show: true
              }
            },
            itemStyle: {
                borderColor: 'lightgrey',
                areaColor: '#f7f7f7',
            },
            emphasis: {
              itemStyle: {
                areaColor: '#c7c9c9',
              },
              label: {
                color: colours.grey900
              }
            },
            select: {
              disabled: false,
              itemStyle: {
                areaColor: '#c7c9c9',
              },
              label: {
                color: colours.grey900
              }
            },
            data: data,
            // layoutCenter: ['45%', '55%'],
            // layoutSize: 550
            // left: 0,
            // right: 0,
            // top: 40,
            // bottom: 10
          }
        ]
      }

      $: data, config

</script>

<EChartsMap {config} {data}/>

