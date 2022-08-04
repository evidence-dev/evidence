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
      <p>Format tags like <code>_usd</code> and <code>_pct</code> let you control how data will be formatted in Evidence.</p><p>Apply format tags by including them at the end of column names. For example:</p> 
      <pre>
select 
  growth as growth<span class=format-tag>_pct</span>, -- formatted as a percentage
  sales as sales<span class=format-tag>_usd</span>    -- formatted as US dollars
from table 
      </pre>
      <p></p>
    </div>
    <div class="panel">
      <h1>Built in Format Tags</h1>
      <p>All of the built in format tags are listed below for reference.</p>
      <CollapsibleTableSection headerText={"Dates"} expanded={false}>
        <BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "date")}/>
      </CollapsibleTableSection>
      <CollapsibleTableSection headerText={"Currencies"} expanded={false}>
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
      <h1>Custom Format Tags</h1>
      <p>
        Add new format tags to your project. Custom format tags use <a class=docs-link target=none href="https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68">excel-style format codes.</a>
      </p>
        <CustomFormatsSection
          builtInFormats={BUILT_IN_FORMATS}
          {customFormattingSettings}
        />
      </div>
      </div>
  <footer>
    <span
      >Learn more about <a
        class="docs-link"
        target=none
        href="https://docs.evidence.dev/features/value-formatting"
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

  .panel:first-of-type {
    border-top: none;
  }

  pre {
    background-color: var(--blue-999);
    color: var(--grey-100);
    font-size: 10pt;
    border-radius: 4px;
    padding: 0.5em;
  }

  /* .format-tag {
    background-color: var(--blue-100);
    border-radius: 4px;
    padding: 2px 4px 2px 4px;
  } */

  .format-tag {
    color: var(--blue-300);
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
