<script>
    import formatTitle from '$lib/modules/formatTitle.js'

    export let name;
    export let value;
    export let label;

    if(!label){
        label = formatTitle(name)
    }

    import { variables } from '$lib/modules/stores.js';   

    $: varObj = {
        [name]: value
    }
    $: variables.update(d => { return {...d, ...varObj} });

</script>

<div class=calcRow>
<span class=label>{label}</span>
<span class=numin>{value}</span>
</div>

<style>
    .calcRow {
        justify-items: space-between;
        background-color: var(--grey-100);
        border-top: 1px solid black;
        margin-top: 4px;
        font-weight: 600;
        font-family: sans-serif;
        font-size: 14px;
        padding-left: 1px;
    }

    .label {
        /* padding-left: 4px; */
    }

    .numin {
        float: right;
        font-weight: 600;
        font-family: sans-serif;
        font-size: 14px;
        text-align: right;
        background-color: transparent;
        border: none;
        margin: auto 10px auto 0;
    }

</style>