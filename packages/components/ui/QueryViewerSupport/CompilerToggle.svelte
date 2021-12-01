<script>
    import { slide } from 'svelte/transition';

    export let showCompiled 

    const toggleCompiled = function() {
        showCompiled = !showCompiled
    }

</script>


<div class="toggle" transition:slide|local>
    {#if showCompiled}
        <span class = "on">Compiled</span>
        <span on:click={toggleCompiled} class = "off">Original</span>
    {:else}
        <span on:click={toggleCompiled} class = "off">Compiled</span>
        <span class = "on">Original</span>
    {/if}
</div>

<style>

   div.toggle {
     background-color: var(--grey-100);
     border-left: 1px solid var(--grey-200);
     border-right: 1px solid var(--grey-200);
     border-bottom: 1px solid var(--grey-200);
     padding: 4px 12px 0 12px;
     font-family: var(--ui-font-family);
     font-size:10px;
     user-select: none;
     -webkit-user-select: none;
     -moz-user-select: none;
     text-align: right;
   }

   span.on {
    padding:2px 4px 2px 4px;
    border-radius: 3px 3px 0 0 ;
    cursor: pointer;
    background-color: var(--grey-100);
    color:var(--blue-500);
    border-left: 1px solid var(--grey-200);
    border-top: 1px solid var(--grey-200);
    border-right: 1px solid var(--grey-200);
    border-bottom: 2px solid var(--grey-100);
    transition: all 400ms;
   }

   span.off {
    padding:2px 4px 2px 4px;
    border-radius: 3px 3px 0 0;
    cursor: pointer;
    color: var(--grey-400);
    border: 1px solid var(--grey-200);
    border-bottom: 1px solid var(--grey-200);
    background-color: var(--grey-100);
    transition: all 400ms;
   }

/* .toggle {
      padding: 4px 0 0 12px;
    }

    span {

    }

    span:hover{
      border: 1px solid var(--grey-300);
    }

    span.on {

    } */

</style>