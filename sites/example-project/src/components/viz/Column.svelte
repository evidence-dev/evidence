<script>
    import {getContext} from 'svelte'
    import { propKey } from './context'
    let props = getContext(propKey)

    export let name;
    export let label;
    export let color;
    export let img=false;
    export let height;
    export let width;

    // Experimental - color lookups
    switch (color) {
        case "blue":
            color = "var(--blue-100)"
            break;
        case "grey":
            color = "var(--grey-200)"
            break;
        case "yellow":
            color = "var(--yellow-200)"
            break;
        case "red":
            color = "var(--red-200)"
            break;
        case "green":
            color = "var(--green-100)"
            break;
        default:
            break;
    }

    export let align;
    if(align === "centre"){ align = "center"};

    export let fontColor;
    export let contentType;

    let options = {
        name: name,
        label: label,
        color: color,
        align: align,
        fontColor: fontColor,
        contentType: contentType,
        img: img,
        height: height,
        width: width,
    }

    props.update(d => {
        d.columns.push(options); 
        return d
    })

</script>

