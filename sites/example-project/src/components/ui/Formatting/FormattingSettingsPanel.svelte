<script>
  export let customFormattingSettings;
  import { BUILT_IN_FORMATS } from "$lib/modules/builtInFormats";
  import BuiltInFormatGrid from "./BuiltInFormatGrid.svelte";
  import CustomFormatsSection from "./CustomFormatsSection.svelte";
  import CollapsibleTableSection from "./CollapsibleTableSection.svelte";
  import CurrencyFormatGrid from "./CurrencyFormatGrid.svelte";
</script>

<form>
  <div class="container">
    <div class="panel">
      <h1>Value Formatting</h1>
      <p>Value formatting in Evidence is achieved using format tags appended to SQL column names.</p>

      <h2>Example</h2>
      <code class=sql-example>select date as month<span class=format-tag>_mmm</span>, sales as sales<span class=format-tag>_usd</span> from table  </code>  
      <p></p>
      <p>Choose from the list of available format tags below, or create a custom format tag using Excel-style format codes. <a class=docs-link target=none href="https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68">Learn about Excel format codes here &rarr;</a></p>

    </div>
    <div class="subpanels">
      <CollapsibleTableSection headerText={"Dates"} expanded={true}>
        <BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "date")}/>
      </CollapsibleTableSection>
      <CollapsibleTableSection headerText={"Currencies"} expanded={false}>
        Evidence supports several international currencies. Select a currency from the drop-down below to see the available format tags.
        <CurrencyFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "currency")} />
      </CollapsibleTableSection>
      <CollapsibleTableSection headerText={"Numbers"} expanded={false}>
        <BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "number")} />
      </CollapsibleTableSection>
      <CollapsibleTableSection headerText={"Percentages"} expanded={false}>
        <BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "percent")} />
      </CollapsibleTableSection>
      
    </div>
    <div class="panel">
      <CollapsibleTableSection headerText={"Custom Formats"} expanded={true}>
        Custom formats can be used in the same way as built-in formats. Note that your format tag will not appear in the column title when used in a component.  
        <svelte:component
          this={CustomFormatsSection}
          builtInFormats={BUILT_IN_FORMATS}
          {customFormattingSettings}
        />
      </CollapsibleTableSection>
      </div>
  </div>
  <footer>
    <span
      >Learn more about <a
        class="docs-link"
        target=none
        href="https://docs.evidence.dev/features/queries/number-formatting"
        > formatting in Evidence &rarr;</a
      ></span
    >
  </footer>
</form>

<style>
  .container {
    margin-top: 2em;
    border-top: 1px solid var(--grey-200);
    border-left: 1px solid var(--grey-200);
    border-right: 1px solid var(--grey-200);
    border-radius: 5px 5px 0 0;
    font-size: 14px;
    font-family: var(--ui-font-family);
  }
  .panel {
    border-top: 1px solid var(--grey-200);
    padding: 1em;
  }

  .subpanels {
    border-top: 1px solid var(--grey-200);
    padding: 1em 1em 1em 1em;
  }

  .panel:first-of-type {
    border-top: none;
  }

  .sql-example {
    font-size: 11pt;
  }

  /* .format-tag {
    background-color: var(--blue-100);
    border-radius: 4px;
    padding: 2px 4px 2px 4px;
  } */

  .format-tag {
    color: var(--blue-600);
    font-weight: 800;
  }
  footer {
    border: 1px solid var(--grey-200);
    border-radius: 0 0 5px 5px;
    background-color: var(--grey-100);
    padding: 1em;
    display: flex;
    font-size: 14px;
    align-items: center;
    font-family: var(--ui-font-family);
  }

  .docs-link {
        color: var(--blue-600);
        text-decoration: none;
    }

    .docs-link:hover {
        color: var(--blue-800);
    }

</style>
