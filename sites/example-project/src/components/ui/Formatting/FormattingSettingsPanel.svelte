<script>
  export let customSettings;
  import { builtInFormats } from "$lib/modules/formats";
  import BuiltInFormating from "./BuiltInFormating.svelte";
  import CustomFormatting from "./CustomFormatting.svelte";
  import { slide } from "svelte/transition";
</script>

<form>
  <div class="container">
    <div class="panel">
      <h1>Value Formatting</h1>
    </div>
    <div class="panel" transition:slide|local>
      <svelte:component this={BuiltInFormating} {builtInFormats} />
      <svelte:component
        this={CustomFormatting}
        {builtInFormats}
        {customSettings}
      />
    </div>
    <footer>
      <span
        >Learn more about <a
          class="docs-link"
          href="https://exceljet.net/custom-number-formats"
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
