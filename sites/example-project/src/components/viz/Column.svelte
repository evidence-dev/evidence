<script>
    import {getContext} from 'svelte'
    import { propKey } from './context'

    let props = getContext(propKey)

    let error;

    export let id;

    // Simple check of column name in dataset. Should be replaced with robust error handling in the future:
    $: if(!Object.keys($props.data[0]).includes(id)){
        error = "Error in table: " + id + " does not exist in the dataset"
        throw new Error(error)
    }

    export let title = undefined;
    export let align = undefined;
    if(align === "centre"){ align = "center"};

    let options = {
        id: id,
        title: title,
        align: align,
    }

    props.update(d => {
        d.columns.push(options); 
        return d
    })

</script>