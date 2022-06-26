<script>
  export let headerText;
  let expanded = true;
  let toggleExpanded = () => {
    expanded = !expanded;
  };
</script>

<div class="collapsibleSection">
  <collapsibleHeader>
    <button area-expanded={expanded} on:click|preventDefault={toggleExpanded}>
      <h2>{headerText}</h2>
      <svg viewBox="0 0 20 20" fill="none">
        <path class="vert" d="M10 1V19" stroke="black" stroke-width="2" />
        <path d="M1 10L19 10" stroke="black" stroke-width="2" />
      </svg>
    </button>
  </collapsibleHeader>
  <div class="collapsibleContents" hidden={!expanded}>
    <slot />
  </div>
</div>

<style>
  collapsibleHeader {
    margin: 0;
    padding: 0;
    vertical-align: middle;
  }

  h2 {
    margin: 0;
  }

  button {
    background-color: var(--background, #fff);
    color: var(--gray-darkest, #282828);
    display: flex;
    justify-content: space-between;
    width: 100%;
    border: none;
    margin: 0;
    padding: 0.2em 0.5em;
  }

  button[area-expanded="true"] .vert {
    display: none;
  }
  svg {
    margin-top: 0.1em;
    height: 1em;
    width: 1em;
    outline: 1px solid;
  }
  .collapsibleContents {
    border: 1px solid var(--gray-light, #eee);
    padding-top: 5px;
    padding-bottom: 5px;
  }

  .collapsibleSection {
    padding: 0px;
    margin: 0px;
  }
</style>
