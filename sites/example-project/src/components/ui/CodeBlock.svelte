<script>
  export let source;
  export let copyToClipboard = true;
  import Copy from "./Deployment/CopyIcon.svelte";
  let copied = false;

  const toggleCopied = function () {
    copied = false;
  };

  export let copy = async (text) => {
    try {
      if (!copied) {
        await navigator.clipboard.writeText(text);
        copied = true;
        setTimeout(toggleCopied, 1000);
      }
    } catch (e) {}
  };
</script>

<pre><code>{#if source}{source}{:else}<slot />{/if}</code>
{#if copyToClipboard}
<button
  type="button"
  class="container"
  class:copied
  on:click={() => {
    if (source !== undefined) {
      copy(source);
    }
  }}>{#if copied}<Copy class="bx--snippet__icon" color="var(--green-600)"/>{:else}<Copy class="bx--snippet__icon" />{/if}</button>
{/if}
</pre>

<style>
  pre {
    overflow: scroll;
    background: var(--grey-800);
    border-radius: 3px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }

  pre code {
    display: block;
    background: none;
    border: none;
    padding: 10px;
    color: var(--grey-100);
    font-size: 0.7em;
  }


  button.container {
        box-sizing: border-box;
        background-color: var(--grey-800);
        border-radius: 4px 4px 4px 4px;
        border: 1px solid var(--grey-400);
        padding: 0.25em 0.35em 0.25em 0.35em;
        color: var(--grey-400);
        size: 0.75em;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        transition: all 100ms;
        margin: 0.5em;
    }

    button.container:hover {
        border-color: var(--grey-300);
        background-color: var(--grey-800);
        color: var(--grey-300);
        transition: all 100ms;
    }
    
    button.container:active {
        border-color: var(--grey-300);
        background-color: var(--grey-800);
        color: var(--green-600);
    }

    button.container.copied {
        border-color: var(--grey-300);
        background-color: var(--grey-800);
        color: var(--green-600);

    }
</style>
