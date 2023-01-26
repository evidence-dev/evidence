<script>
  export let source;
</script>

{#if source}
<pre><code>{source}</code></pre>
{:else}
<pre><code><slot/></code></pre>
{/if}
<style>
    pre{
      overflow: scroll;
      background: var(--grey-800);
      border-radius: 3px;
  
    }
    
    pre code{
      display: block;
      background: none;
      border: none;
      padding: 10px;
      color: var(--grey-100);
      font-size: 0.7em;
    }
</style>
  