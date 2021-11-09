<script>
    import { getContext } from "svelte";
    import getColorPalette from "../modules/getColorPalette.js";
    import getDistinctValues from "../modules/getDistinctValues.js";
    import formatValue from "../modules/formatValue.js"
    const { data, xGet, yGet, xScale, yScale } = getContext("LayerCake");

    // Data:
    export let series = null;
    export let filter = null;
    let xName = getContext("xName");
    let yName = getContext("yName");
    let xFormat = getContext("xFormat");
    let yFormat = getContext("yFormat");
    let xUnits = getContext("xUnits");
    let yUnits = getContext("yUnits");
    export let reverseAxes = "false";

    // Styling:
    export let fillColor = "#488f96";
    export let fillTransparency = 0.25;
    let fillOpacity = 1 - fillTransparency;
    export let outlineColor = "none";
    export let outlineWidth = 0;
    export let outlineTransparency = 0;
    let outlineOpacity = 1 - outlineTransparency;
    export let pointSize = 3;
    
    // MULTI-SERIES LOGIC:

    //Filter dataset if filter value supplied in chart call:
    let finalData = [];
    if (series !== null && filter !== null) {
        finalData = $data.filter((d) => d[series] === filter);
    } else {
        finalData = $data;
    }

    // Get array of global color variables (set in app.css):
    let colorPalette = getColorPalette();

    // Get distinct series names if series column supplied in chart call:
    let seriesNames = [];
    if (series !== null) {
        seriesNames = getDistinctValues(finalData, series);
    }

    $: filteredData = (filter) => {
        return finalData.filter((d) => d[series] === filter);
    };
</script>

{#if series === null || filter !== null}
    {#each finalData as d}
        <circle
            cx={$xGet(d) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}
            cy={$yGet(d) + ($yScale.bandwidth ? $yScale.bandwidth() / 2 : 0)}
            r={pointSize}
            fill={fillColor}
            fill-opacity={fillOpacity}
            stroke={outlineColor}
            stroke-width={outlineWidth}
            stroke-opacity={outlineOpacity}
            ><title
                >{reverseAxes === "false"
                    ? formatValue(d[xName],xFormat,xUnits) +
                      "; " +
                      formatValue(d[yName],yFormat,yUnits)
                    : formatValue(d[xName],xFormat,xUnits)}</title
            ></circle
        >
    {/each}
{:else}
    <g class="scatter-group">
        {#each seriesNames as group, i}
            {#each filteredData(group) as d}
                <circle
                    cx={$xGet(d) +
                        ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}
                    cy={$yGet(d) +
                        ($yScale.bandwidth ? $yScale.bandwidth() / 2 : 0)}
                    r={pointSize}
                    fill="var({colorPalette[i]})"
                    fill-opacity={fillOpacity}
                    stroke={outlineColor}
                    stroke-width={outlineWidth}
                    stroke-opacity={outlineOpacity}
                    ><title
                        >{group +
                            ": " +
                            (reverseAxes === "false"
                                ? formatValue(d[xName],xFormat,xUnits) +
                                  "; " +
                                  formatValue(d[yName],yFormat,yUnits)
                                : formatValue(d[xName],xFormat,xUnits))}</title
                    ></circle
                >
            {/each}
        {/each}
    </g>
{/if}
