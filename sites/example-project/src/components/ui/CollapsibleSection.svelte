<script>
    import { page } from '$app/stores';

    export let folder;
    export let menu;
    export let open;

    let folderContents = menu.filter(d => d.folder === folder)

    let expanded = false

    function toggle() {
        expanded = !expanded;
        open = !open;
    }
</script>

   <div class=collapsible>
    <a href={"/"+folder} aria-expanded={expanded} sveltekit:prefetch on:click={toggle}>
        <div class=folder class:selected="{"/"+$page.path.split('/')[1] === "/" + folder}" >
            {folder} >
        </div>
    </a>


    <div class='contents' hidden="{("/"+$page.path.split('/')[1] !== "/" + folder) || !expanded}">
        {#each folderContents as item}
        {#if item.label != 'index' && !item.label.includes("[") && item.label !== item.folder}
        <div class=content-item>
        <a href={item.href} sveltekit:prefetch on:click={() => open = !open}>
            <div class:selected="{"/"+$page.path.split('/')[1] === item.href}" >
                {item.label}
            </div>
        </a>
        </div>
        {/if}
        {/each}
    </div>
    </div>

<style>
  
a {
	text-transform: capitalize;
	color:var(--grey-800);
	display: inline-block;
	text-decoration: none;
	font-family: var(--ui-font-family);
	-webkit-font-smoothing: antialiased;

    font-size: 16px;
    color: var(--grey-700);
    cursor: pointer;
}

.folder {
    width: 100%;
	padding: 0.2em 1em 0.2em 1em;
    display: block;
}

.content-item {
    width: 100%;
	padding: 0.2em 1em 0em 1.5em;
    display: block;
}

</style>