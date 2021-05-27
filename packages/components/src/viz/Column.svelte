<script>
    import { getContext } from 'svelte';
  
    const { data, xGet, yGet, yRange, xScale } = getContext('LayerCake');
  
    $: columnWidth = d => {
      const vals = $xGet(d);
      return Math.max(0, (vals[1] - vals[0]));
    };
  
    $: columnHeight = d => {
      return $yRange[0] - $yGet(d);
    };
  
    /* --------------------------------------------
     * Default styles
     */
    export let fill = 'rgb(235, 238, 240)';
    export let stroke = 'blue';
    export let strokeWidth = 0;

  </script>
  
  <g class="column-group">
    {#each $data as d, i}
      <rect
        class='group-rect'
        data-id="{i}"
        x="{$xScale.bandwidth ? $xGet(d) : $xGet(d)[0]}"
        y="{$yGet(d)}"
        width="{$xScale.bandwidth ? $xScale.bandwidth() : columnWidth(d)}"
        height="{columnHeight(d)}"
        {fill}
        {stroke}
        stroke-width="{strokeWidth}"
      />
    {/each}
  </g>