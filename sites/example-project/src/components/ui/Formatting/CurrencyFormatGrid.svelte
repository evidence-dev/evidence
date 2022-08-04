<script>
  import "./format-grid.css";
  import { blur } from 'svelte/transition';
  import { SUPPORTED_CURRENCIES } from "$lib/modules/builtInFormats";
  import { defaultExample, formatExample } from "$lib/modules/formatting";
  export let formats;
  let selectedCurrency;
</script>

<select bind:value={selectedCurrency}>
  <option>Choose a currency</option>
  ${#each SUPPORTED_CURRENCIES as currency}
    <option name={currency.primaryCode} id={currency.primaryCode} value={currency.primaryCode}>{currency.displayName}</option>
  {/each}
</select>
{#if selectedCurrency != 'Choose a currency'}
<table transition:blur>
  <thead>
    <th class="align_left narrow_column">Format Tag</th>
    <th class="align_left wide_column">Format Code</th>
    <th class="align_left wide_column">Example Input</th>
    <th class="align_right wide_column">Example Output</th>
  </thead>
  {#each formats.filter(d => d.parentFormat === selectedCurrency) as format}
    <tr transition:blur>
      <td transition:blur>{format.formatTag} </td>
      <td transition:blur>{format.formatCode} </td>
      <td transition:blur>
        <input
          id="id_format_row{format.formatTag}"
          placeholder={format.exampleInput || defaultExample(format.valueType)}
          bind:value={format.userInput}
          on:blur={(format.userInput = undefined)}
          class="align_left input_box"
        />
      </td>
      <td class="align_right" transition:blur>{formatExample(format)}</td>
    </tr>
  {/each}
</table>
{/if}

<style>
  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;   
    padding:0.75em;
    width: calc(100% + 14px);
    border: 1px solid var(--grey-200); 
    font-family: var(--ui-font-family);
    color: var(--grey-800); 
    margin: 0.5em 0 1.5em -7px;
    transition: all 400ms;
    cursor: pointer;
  }
  select:hover{
      border: 1px solid var(--grey-300);
      transition: all 400ms;
      box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
  }
  select:focus {
      outline: none;
  }
</style>
