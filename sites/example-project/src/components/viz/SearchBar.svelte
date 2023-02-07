<script>
    import MdSearch from 'svelte-icons/md/MdSearch.svelte'

    export let placeholder = "Search";
    export let value;
    export let searchFunction;
</script>

<div class=search-container>
<input class=search-bar type=text placeholder={placeholder} bind:value={value} on:keyup={() => searchFunction(value)}/>
<div class=search-icon>
    <MdSearch/>
</div>
</div>

<style>

    .search-container {
        width: 30%;
        display: block;
        align-items: center;
        border: 1px solid var(--grey-300);
        border-radius: 4px;
        height: 22px;
        position: relative;
        margin: 25px 3px 10px 3px;
    }


    .search-icon {
        height: 16px;
        width: 16px;
        padding-left: 3px;
        margin: 0;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        -ms-transform: translateY(-50%);
        color: var(--grey-400);
    }

    .search-bar {
        margin: 0;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        -ms-transform: translateY(-50%);

        border: none;
        padding-left: 23px;

        color: var(--grey-600);
        font-size: 9pt;

        width: calc(100% - 30px);
    }

    *:focus {
        outline: none;
    }

    @media (max-width: 600px) {
        .search-container {
            width: 98%;
            height: 28px;
        }

        .search-bar {
            font-size: 16px;
            width: calc(100% - 40px);
        }
    }


    @media print {
        .search-container {
            visibility: hidden;
        }
    }
</style>