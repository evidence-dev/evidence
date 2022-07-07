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
      <p>Evidence does auto formatting. If you don't give us a format tag, we'll do our best to format the data based on what we see in the column. That means year and id alone get the right treatment</p>
      <p>Auto formatting takes care of units - e.g., k, M, B - based on the data in your column</p>
      <p>Evidence supports Excel format codes</p>
      <p>Here's how to use format tags</p>
    </div>
    <div class="subpanels">
      <CollapsibleTableSection headerText={"Dates"}>
        <BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "date")}/>
      </CollapsibleTableSection>
      <CollapsibleTableSection headerText={"Currencies"}>
        Evidence supports a wide range of international currencies. Select a currency from the drop-down below to see the available format tags.
        <CurrencyFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "currency")} />
      </CollapsibleTableSection>
      <CollapsibleTableSection headerText={"Numbers"}>
        <BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "number")} />
      </CollapsibleTableSection>
      <CollapsibleTableSection headerText={"Percentages"}>
        <BuiltInFormatGrid formats={BUILT_IN_FORMATS.filter(d => d.formatCategory === "percent")} />
      </CollapsibleTableSection>
      
    </div>
    <div class="panel">
      <CollapsibleTableSection headerText={"Custom Formats"}>
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
      >Learn more about Excel Style Custom Formats<a
        class="docs-link"
        href="https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68"
        >value formatting &rarr;</a
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
</style>
