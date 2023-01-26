<script>
  export let chartName = Title;
  export let chartPage = null
  export let partialWidth = false;
</script>

<a href={"/component-reference/"+chartPage} class="gallery-item-grid" >
  <div class="chart" class:partial-width="{partialWidth === 'true'}">
    <slot />
    <div><h2>{chartName}</h2></div>
  </div>
</a>

<style>
  div.chart {
    min-width: 220px;
    padding: 0em 1em 1em 1em;
    flex-direction: column;
    display: flex;
    flex-grow: 1;
    justify-content: flex-end;
  }


  .partial-width {
    align-items: center;
  }



  :global(svg:hover) {
    cursor: pointer !important;
  }



  h2 {
    text-align: center;
    font-size: 1.0em;
  }

.gallery-item-grid {
  cursor: pointer;
  transition: 0.3s ease-in-out;
  overflow: hidden;
  border-radius: 5px;
  padding: 8px;
  padding-top: 4px;
  padding-bottom: 0px;
  box-shadow: 1px 1px 4px #d4d4d4;
  background-color: white;
  transition:box-shadow 350ms;
  text-decoration: none;
  color: unset;
  display: flex;
}

.gallery-item-grid:hover {
  box-shadow: 1px 2px 5px 2px #d4d4d4;
}

</style>
