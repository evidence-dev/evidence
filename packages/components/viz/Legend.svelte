<script>
    import getColorPalette from '../modules/getColorPalette.js';
    export let seriesNames;
    import {onMount} from 'svelte';

    let colorPalette = [];
    onMount(async () => {
        const colors = await getColorPalette();
        colorPalette = colors;
    });
</script>

  <div class='key grabbable'>
    <div class="hold">
    {#each seriesNames as name, i}
    <div class='key-item'>
      <div
        class='chip chip__circle'
        style='background: var({colorPalette[i]});'
      ></div>
      <div class='name'>{name}</div>
    </div>
    {/each}
  </div>
  </div>

<style>
    .key {
      display: flex;
      /* justify-content: center; */
      align-items: center;
      overflow-x: scroll;
      width: 100%;
      margin-bottom: -1em;
      padding-bottom: 10px;
    }

    .hold {
      margin: auto;
      display: flex;
    }

     /* .key::-webkit-scrollbar-thumb {
        display: none;
    }  */

    .key-item {
      margin-right: 14px;
      white-space: nowrap;
      vertical-align: middle;
    }
    .chip {
      display: inline-block;
      position: relative;
      width: 10px;
      height: 10px;
    }
    .chip__circle {
      border-radius: 50%;
      vertical-align: middle;
    }
    .name {
      display: inline;
      font-size: 0.725em;
      text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
      font-family: "SF Display", -apple-system, BlinkMacSystemFont, "Segoe UI",
			Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji",
			"Segoe UI Emoji", "Segoe UI Symbol";
		font-weight: normal;
        color: rgb(141, 141, 141);
        padding-right: 10px;
        vertical-align: middle;
    }

    /* .grabbable {
    cursor: move; =
    cursor: grab;
    cursor: -moz-grab;
    cursor: -webkit-grab;
  } */
  
  /* .grabbable:active {
      cursor: grabbing;
      cursor: -moz-grabbing;
      cursor: -webkit-grabbing;
  } */

  </style>



<!-- 
<div class='key'>
    <div class='key-item'>
      <div
        class='chip chip__circle'
        style='background: lightblue;'
      ></div>
      <div class='name'>Item Name</div>
    </div>
    <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Longer Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>
      <div class='key-item'>
        <div
          class='chip chip__circle'
          style='background: lightblue;'
        ></div>
        <div class='name'>Item Name</div>
      </div>

  </div> -->