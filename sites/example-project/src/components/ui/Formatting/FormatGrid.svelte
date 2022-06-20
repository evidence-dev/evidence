<script>
  import * as ssf from "ssf";

  export let formats;

  const defaultExample = (valueType) => {
    switch (valueType) {
      case "number":
        return 1234;
      case "date":
        return "Jan 3, 2022";
      default:
        return undefined;
    }
  };

  function formatExample(format) {
    let normalizedUserInput = format.userInput?.trim();
    let preFormattedValue =
      normalizedUserInput ||
      format.exampleInput ||
      defaultExample(format.valueType);
    if (preFormattedValue) {
      try {
        let typedPreformattedValue;
        switch (format.valueType) {
          case "number": {
            typedPreformattedValue = Number(preFormattedValue);
            if (Number.isNaN(preFormattedValue)) {
              throw "input is not a number";
            }
            break;
          }
          case "date": {
            typedPreformattedValue = new Date(preFormattedValue);
            break;
          }
          default: {
            typedPreformattedValue = preFormattedValue;
            break;
          }
        }
        if (typedPreformattedValue) {
          return ssf.format(format.formatValue, typedPreformattedValue);
        }
      } catch (error) {
        console.log(error);
      }
    }
    return "";
  }
</script>

<table width="100%">
  <thead>
    <th>Name</th>
    <th>Format</th>
    <th>Example Input</th>
    <th>Example Output</th>
  </thead>
  {#each formats as format}
    <tr>
      <td>{format.formatName} </td>
      <td>{format.formatValue} </td>
      <td
        ><input
          id="id_format_row{format.formatName}"
          placeholder={format.exampleInput || defaultExample(format.valueType)}
          bind:value={format.userInput}
          on:blur={(format.userInput = undefined)}
        />
      </td>
      <td>{formatExample(format)}</td>
    </tr>
  {/each}
</table>

<style>
  table {
    width: 100%;
    font-size: calc(0.75em - 0px);
    border-collapse: collapse;
    font-family: sans-serif;
  }
  th {
    max-width: 1px;
    font-weight: 600;
    border-bottom: 1px solid rgb(110, 110, 110);
    padding: 0px 8px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  td {
    max-width: 1px;
    padding: 4px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  tr:hover {
    background-color: rgb(247, 249, 250);
  }
</style>
