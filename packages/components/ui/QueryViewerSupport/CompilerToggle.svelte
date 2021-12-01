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
        <span on:click={toggleCompiled} class = "off">Written</span>
    {:else}
        <span on:click={toggleCompiled} class = "off">Compiled</span>
        <span class = "on">Written</span>
    {/if}
</div>

<style>
    /* Pills */
    div.toggle { 
        background-color: var(--grey-100);
        border-left: 1px solid var(--grey-200);
        border-right: 1px solid var(--grey-200);
        padding: 14px 0 0 20px;
        font-family: var(--ui-font-family);
        font-size:10px;
        font-weight: bold;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
    }

    span {
        padding:2px 4px 2px 4px;
        border-radius: 3px;
        cursor: pointer;
    }

    span.off {
        color: var(--grey-600);
        border: 1px solid var(--grey-100); 
        transition: all 400ms;
    }

    span.off:hover {
        color: var(--grey-700);
        border: 1px solid var(--grey-300); 
        transition: all 400ms;
    }

    span.on {
        color: var(--blue-700);
        background-color: var(--blue-100);
        border: 1px solid var(--blue-200); 
    }

    /* Tab Bar  */
   /* div.toggle {
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
   } */
</style>