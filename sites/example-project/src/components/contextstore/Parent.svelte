<script>
    import {setContext} from 'svelte'
    import {writable} from 'svelte/store'
    import {configKey} from './context.js'
    export let prop = 1

    let writableStore = writable({parent: 400*prop})

    setContext(configKey, writableStore)
    
    writableStore.update(d => {return {...d, moreFromParent: 300*prop}})

    let toggle = true 

</script>

<div>
    <input type=checkbox bind:checked={toggle}>

    {#if toggle}
    <p>
       Contents of the store as accessed from the parent:
    </p>
    <p>
        {JSON.stringify($writableStore)}
    </p>
    <hr/>
    <slot/>
    {/if}
</div>

<style>
    div {
        margin-top: 2em;
        background-color: lightgrey;
        border-radius: 7px;
        border: 2px solid forestgreen;
        padding: 2em;
        font-family: var(--monospace-font-family);
    }
</style>


