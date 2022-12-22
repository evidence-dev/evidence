<script>
    import {getContext} from 'svelte'
    import { propKey } from './context'

    let props = getContext(propKey)

    let error;

    export let name;

    // Simple check of column name in dataset. Should be replaced with robust error handling in the future:
    $: if(!Object.keys($props.data[0]).includes(name)){
        error = "Error in table: " + name + " does not exist in the dataset"
        throw new Error(error)
    }

    export let label = undefined;
    export let color = undefined;

    export let align = undefined;
    if(align === "centre"){ align = "center"};

    export let fontColor = undefined;

    let options = {
        name: name,
        label: label,
        color: color,
        align: align,
        fontColor: fontColor,
    }

    props.update(d => {
        d.columns.push(options); 
        return d
    })

</script>