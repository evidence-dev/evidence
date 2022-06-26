<script>
  export let customSettings;
  import { builtInFormats } from "$lib/modules/formats";
  import BuiltInFormatGrid from "./BuiltInFormatGrid.svelte";
  import CustomFormatsSection from "./CustomFormatsSection.svelte";
  import { slide } from "svelte/transition";
  import CollapsibleTableSection from "./CollapsibleTableSection.svelte";
</script>

<form>
  <div class="container">
    <div class="panel">
      <h1>Value Formatting</h1>
    </div>
    <div class="subpanels" transition:slide|local>
      <CollapsibleTableSection headerText={"Built-in Formats"}>
        <svelte:component this={BuiltInFormatGrid} formats={builtInFormats} />
      </CollapsibleTableSection>
      <div class="spacer" />
      <CollapsibleTableSection headerText={"Custom Formats"}>
        <svelte:component
          this={CustomFormatsSection}
          {builtInFormats}
          {customSettings}
        />
      </CollapsibleTableSection>
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
  </div>
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

  .spacer {
    margin: 1em;
  }
</style>
