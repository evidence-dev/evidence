<script>
  import "./format-grid.css";
  import { defaultExample, formatExample } from "$lib/modules/formats";
  import TiDeleteOutline from "svelte-icons/ti/TiDeleteOutline.svelte";
  export let formats;
  export let deleteHandler;
</script>

<table width="100%">
  <thead>
    <th class="align_left narrow_column">Format Tag</th>
    <th class="align_left medium_column">Format Code</th>
    <th class="align_left narrow_column">Type</th>
    <th class="align_left medium_column">Example Input</th>
    <th class="align_right medium_column">Example Output</th>
    <th><!--actions --></th>
  </thead>
  {#each formats as format}
    <tr>
      <td>{format.formatTag} </td>
      <td>{format.formatCode} </td>
      <td>{format.valueType}</td>
      <td>
        <input
          id="id_format_row{format.formatTag}"
          placeholder={format.exampleInput || defaultExample(format.valueType)}
          bind:value={format.userInput}
          on:blur={(format.userInput = undefined)}
          class="align_left input_box"
        />
      </td>
      <td class="align_right">{formatExample(format)}</td>
      <td on:click={() => deleteHandler(format)} tooltip="Remove">
        <div class="deleteIcon"><TiDeleteOutline /></div>
      </td>
    </tr>
  {/each}
</table>

<style>
  .deleteIcon {
    color: red;
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
</style>
