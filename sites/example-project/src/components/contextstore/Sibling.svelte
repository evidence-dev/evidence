<script>
    import {getContext} from 'svelte'
    import {configKey} from './context'
    export let input = 300

    let store = getContext(configKey)

    store.update(d => {return {...d, fromSibling: input}})

</script>