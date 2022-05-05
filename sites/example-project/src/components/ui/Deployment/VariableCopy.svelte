<script>
    import {blur} from 'svelte/transition'
    export let text = undefined;
    export let hideText = false
    let copied = false 

    const toggleCopied = function() {
        copied = !copied
    }

    export let copy = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        copied = true
        setTimeout(toggleCopied, 2000)

      } catch (e) {
      }
    };
  
    import Copy from "./CopyIcon.svelte";
  

  </script>

  <div class=container class:copied>
    <span class=var-value 
        on:click="{() => {
            if (text !== undefined) {
                copy(text);
            };
        }}"
  >
    {#if copied}
    <code in:blur>Copied</code>
    {:else}
    <code in:blur>

      {@html hideText ? '&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;' : text}


    </code>
    {/if}

  </span>
  {#if copied}
  <Copy class="bx--snippet__icon" color='var(--green-900)'/>
  {:else}
  <Copy class="bx--snippet__icon"/>
  {/if}

</div>

  <style>
    div.container {
        box-sizing: border-box;
        background-color: var(--grey-100);
        border-radius: 4px 4px 4px 4px;
        border: 1px solid var(--grey-200);
        padding: 0.25em 0.25em 0.25em 0.25em;
        color: var(--grey-999);
        font-size: 16px;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        display:flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        transition: all 400ms;
    }

    div.container:hover {
        border-color: var(--blue-500);
        background-color: var(--blue-100);
        transition: all 400ms;
    }
    
    div.container:active {
        border-color: var(--green-500);
        background-color: var(--green-100);
    }

    div.container.copied {
        border-color: var(--green-500);
        background-color: var(--green-100);
        color: var(--green-900);

    }

    span.var-value {
        width: 85%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

  </style>