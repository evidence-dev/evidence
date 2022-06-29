<script>
  import "./format-grid.css";
  import { defaultExample, formatExample } from "$lib/modules/formats";
  export let formats;
</script>

<div class="tableContainer">
<table class="formatTable" width="100%">
  <thead>
    <th class="align_left narrow_column">Format Tag</th>
    <th class="align_left wide_column">Format Code</th>
    <th class="align_left wide_column">Example Input</th>
    <th class="align_right wide_column">Example Output</th>
  </thead>
  {#each formats as format}
    <tr>
      <td>{format.formatTag} </td>
      <td>{format.formatCode} </td>
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
    </tr>
  {/each}
</table>
</div>

<style>
  .formatTable {
    font-size: 12px;
  }

  .tableContainer {
    border: 1px solid var(--gray-light, #eee);
    border-radius: 4px;
    padding: 8px 4px 8px 4px;
  }
</style>
