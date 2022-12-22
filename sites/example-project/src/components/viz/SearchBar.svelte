<script>
    // import MdSearch from 'svelte-icons/md/MdSearch.svelte'

    export let placeholder = "Search";
    export let value;
    export let searchFunction;
</script>

<div class=search-container>
<input class=search-bar type=text placeholder={placeholder} bind:value={value} on:keyup={() => searchFunction(value)}/>
<div class=search-icon>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="s-zV66bAK704iV"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
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
        margin: 10px 3px 10px 3px;
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
    }

    .search-bar {
        /* border: 1px solid var(--grey-200);
        border-radius: 2px; */
        /* border: none;
        font-size: 8pt;
        float: right;
        margin-bottom: 5px;
        padding: 3px 4px 3px 4px; */

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

    svg {
        display: block;
        color: var(--grey-400);
    }

    *:focus {
        outline: none;
    }

    @media (max-width: 600px) {
        .search-container {
            width: 98%;
            height: 28px;
        }
    }


    @media print {
        .search-container {
            visibility: hidden;
        }
    }
</style>