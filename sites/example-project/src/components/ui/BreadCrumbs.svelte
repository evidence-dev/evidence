<script>
    import { page } from '$app/stores';
    import { blur } from 'svelte/transition'
    import { showQueries } from '@evidence-dev/components/ui/stores'
    import { pageHasQueries } from '@evidence-dev/components/ui/stores';

    export let folderList;

    $: pathArray = $page.path.split('/').slice(1)

    const buildCrumbs = function (pathArray) {
        let crumbs = [
            {
                href:'/', 
                title: "Home"
            }
        ]
        pathArray.forEach((path, i) => {
            if (path != '') {
                let crumb = {
                    href: "/"+pathArray.slice(0,i+1).join("/"), 
                    title: decodeURIComponent(path.replace(/_/g," ").replace(/-/g," "))
                }
                crumbs.push(crumb)
            } 
        })
        if(crumbs.length > 3){
            let upOne = crumbs.slice(-3)[0].href
            crumbs.splice(1, crumbs.length-3, {href: upOne, title:'...'})
        }

        // Check if folder contains no index files - if so, disable breadcrumb link:
        crumbs.forEach((path, i) => {
            if(folderList.filter(d => d.folderHref === path.href && d.indexFileCount === 0).length > 0){
                path.href = 'javascript:void(0)';
            }
        })
        return crumbs
    }

    $: crumbs = buildCrumbs(pathArray)

    function toggleQueries() {
		showQueries.update(value => !value)
	} 
</script>

<div>
    <span class="container"> 
        <span>
            {#each crumbs as crumb, i}
                {#if i > 0 }
                &emsp13;/&emsp13;<a href={crumb.href}>{crumb.title}</a>  
                {:else}
                <a href={crumb.href}>{crumb.title}</a>  
                {/if}
            {/each}
        </span>
        {#if $pageHasQueries}
            <span transition:blur|local>
                {#if $showQueries}
                <button type="button" aria-label="hide-queries" class="dev-controls hide" on:click={toggleQueries}>Hide Queries</button>
                {:else}
                <button type="button" aria-label="show-queries" class="dev-controls show" on:click={toggleQueries}>Show Queries</button>
                {/if}
            </span>
        {/if}
    </span>
</div>

<style>
    div {
        padding: 0 0.5em 0 1.5em;
        box-sizing: border-box;
        width: 100%;
        overflow: auto;
		white-space: nowrap;
		-ms-overflow-style: none;  
  		scrollbar-width: none;  
    }

    span.container {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    span, button {
        font-size: small;
        font-family: var(--ui-font-family-compact);
        -webkit-font-smoothing: antialiased;
        color:var(--grey-700)
    }

    a {
        text-transform: capitalize;
        text-decoration: none;
        color: var(--grey-700);
    }
    a:hover {
        color:var(--grey-999);
        transition:all 0.2s;
    }

    button.dev-controls {
        float: right;
        background-color: transparent;
        text-align: center;
        margin: 0 0 0 1.5em;
        padding: 0.25em 1em 0.25em 1em;
        border: 1px solid var(--grey-300);
        border-radius: 3px;
        font-size: 0.8em;
        color: var(--grey-900);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -webkit-font-smoothing: antialiased;
        width: 9em;
        transition:box-shadow 350ms;
    }

    button.dev-controls:hover {
        box-shadow: 0 5px 5px 2px var(--grey-100);
        transition:all 350ms;
    }

    button.dev-controls.show {
		background: -webkit-linear-gradient(315deg, var(--blue-600) 0%, var(--green-600) 75%);
        text-decoration: none;
		-webkit-background-clip: text;
        background-clip: text;
  		-webkit-text-fill-color: transparent;
        font-weight: bold;
     }

     @media (max-width: 600px) {
        button.dev-controls {
            display: none;
        }
    }

</style>