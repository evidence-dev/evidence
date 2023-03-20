<script>
    import { page } from '$app/stores';
    import { blur } from 'svelte/transition'
    import HomeIcon from '$lib/icons/HomeIcon.svelte'
    export let fileTree;

    $: pathArray = $page.url.pathname.split('/').slice(1)

    // check if a url is an href in the fileTree and return true or false
    const checkUrl = function(href, fileTree) {
        let found = false
        function checkChildren(node) {
            if(node.href === href){
                found = true
            } else if(node.children){
                node.children.forEach(child => {
                    checkChildren(child)
                })
            }
        }
        checkChildren(fileTree)
        return found
    }

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

        // check in the file tree if each crumb has an href
        crumbs.forEach((path, i) => {
            if(!checkUrl(path.href, fileTree)){
                path.href = 'javascript:void(0)';
            }
        })
        return crumbs
    }

    $: crumbs = buildCrumbs(pathArray)

</script>

<div class="main">
    <span class="container"> 
        <span>  
            {#if $page.url.pathname.startsWith('/settings') || $page.url.pathname === '/'}
            <a href="/"><HomeIcon height=14 width=14 verticalOffset=3/> Home</a>
            {:else}
            {#each crumbs as crumb, i}
                {#if i > 0 }
                &emsp13;/&emsp13;<a href={crumb.href}>{crumb.title}</a>  
                {:else}
                <a href={crumb.href}>
                {#if crumb.title === 'Home' }
                 <HomeIcon height=14 width=14 verticalOffset=3/>
                {:else}
                {crumb.title}
                {/if}
                </a>  
                {/if}
            {/each}
            {/if}
            </span>
    </span>
</div>

<style>
    div.main {
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
        display: inline-block;
        text-transform: capitalize;
        text-decoration: none;
        color: var(--grey-700);

    }
    a:hover {
        color:var(--grey-999);
        transition:all 0.2s;
    }


</style>