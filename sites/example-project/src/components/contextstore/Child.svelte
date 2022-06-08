<script>
    import {getContext} from 'svelte'
    import {configKey} from './context'
    export let input = 100

    let store = getContext(configKey)

    store.update(d => {return {...d, fromChild: input}})

</script>
