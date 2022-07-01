<script>
    import formatTitle from '$lib/modules/formatTitle.js'

    export let name;
    export let value;
    export let label;

    if(!label){
        label = formatTitle(name)
    }
</script>

<div class=calcRow>
<span class=label>{label}</span>
<!-- <input class=numin bind:value type=number/> -->
<span class=numin>{value}</span>
</div>

<style>
    .calcRow {
        justify-items: space-between;
        background-color: lightyellow;
        border-top: 1px solid black;
        margin-top: 4px;
        margin-bottom: 25px;
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