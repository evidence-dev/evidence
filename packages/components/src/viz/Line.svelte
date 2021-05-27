<script>
    import { getContext } from 'svelte';

    const { data, xGet, yGet } = getContext('LayerCake');
  
    $: path = 'M' + $data
      .map(d => {
        return $xGet(d) + ',' + $yGet(d);
      })
      .join('L');
  </script>
  
  <path class='path-line' d='{path}'></path>
  
  <style>
    .path-line {
      fill: none;
      stroke-linejoin: round;
      stroke-linecap: round;
      stroke-width: 2;
      stroke: rgba(30, 30, 30, 0.5);
    }
  </style>