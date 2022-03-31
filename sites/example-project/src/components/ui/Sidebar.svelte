<script>
    import { page } from '$app/stores';
	import { dev } from '$app/env';
	import CollapsibleSection from '$lib/ui/CollapsibleSection.svelte'

    export let menu 
	let folders = [...new Set(menu.map(item => item.folder))];
	folders = folders.filter(d => d !== undefined);

	let fileCount;
	let folderList = [];
	let folderObj;
	let folderLink;
	for(let i = 0; i < folders.length; i++){
		let contents = menu.filter(d => d.folder === folders[i]);
		fileCount = contents.filter(d => d.label !== folders[i]).length;
		folderLink = contents.filter(d => d.label === folders[i]).length > 0;
		folderObj = {folder: folders[i], fileCount: fileCount, folderLink: folderLink}
		folderList.push(folderObj)
	}

	// Keep only folders with at least 1 page that is not index.md or a parameterized page (path contains '[')
	folderList = folderList.filter(d => d.fileCount > 0)
	let folderCheck = [];
	for(let i = 0; i < folderList.length; i++){
		folderCheck.push(folderList[i].folder)
	}

	let noFolders = menu.filter(d => d.folder === undefined && !folderCheck.includes(d.folder))

    export let open 

</script>

<aside class="sidebar" class:open>
    <div class="sticky">
        <div class=nav-header>
            <a href='/' on:click={() => open = !open}><h1 class=project-title>Evidence</h1></a>
        </div>
        <nav>
			{#if folders}
            {#each folderCheck as folder}
				<CollapsibleSection {folder} {menu} {folderList} bind:open={open}/>
            {/each}
            {/if}
			
			{#if noFolders}
            {#each noFolders as item}
                {#if item.label != 'index'}
                <a href={item.href} sveltekit:prefetch on:click={() => open = !open} style="">
                    <div class:selected="{"/"+$page.path.split('/')[1] === item.href}">
                        {item.label}
                    </div>
                </a>
                {/if}
            {/each}
            {/if}
        </nav>
        {#if dev}
        <div class="nav-footer">
            <a href='/settings'>Settings</a>
        </div>
        {/if}
    </div>
</aside>

<style>

aside.sidebar {
    grid-area: sidebar;
    position: relative;
    z-index: 3;
    background-color: var(--grey-100);
    border-right: 1px solid var(--grey-300);
}

.sticky {
    position: sticky;
    top: 0;
    padding: 0;
	height: 100vh;
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: 3rem 1fr 4rem;
	grid-template-areas: 
	'header'
	'nav'
	'footer'
	;
}

nav {
    overflow-y: scroll;
	overflow-x: hidden;
	grid-area: nav;
}

a {
	text-transform: capitalize;
	color:var(--grey-800);
	display: inline-block;
	text-decoration: none;
	font-family: var(--ui-font-family);
	-webkit-font-smoothing: antialiased;
}

nav a {
	font-size: 16px;
	display: block;
	color: var(--grey-700);
}

nav div {
	padding: 0.2rem 1rem 0.2rem 1.2rem;
	/* transition-property: background-color;
	transition-duration: 400ms; */
}

nav div:hover {
	background-color: var(--grey-200);
	/* transition-property: background-color;
	transition-duration: 400ms; */
}

nav div:active {
	background-color: var(--grey-300);
}

nav a:hover {
	text-decoration: none;
	background-color: none;
	text-decoration: none;
}

div.selected {
	background-color: var(--grey-200);
	color: var(--grey-999);
	font-weight: 500;

}

div.nav-header {
	padding: 0.2rem 1rem 1.2rem 1.2rem;
	grid-area: header;
}

div.nav-header a {
	display: block;
}

.nav-footer {
	padding: 1.2rem 1rem 1.2rem 1.2rem;
	box-sizing: border-box;

	position:absolute; 
	bottom:0;
	height:100%;
	width: 100%;
	border-top: 1px solid var(--grey-200);
	grid-area:footer;
}

.nav-footer a {
	display:block
}

@media (max-width: 850px) {
	aside.sidebar {
		grid-area: none; 
		position: fixed;
		height: 100%;
		width: 100%; 
		left: -100%;
		transition: left 0.3s ease-in-out; 	
		background-color: hsla(217, 33%, 97%, .83);
		-webkit-backdrop-filter: blur(20px) saturate(1.8);
		backdrop-filter: blur(20px) saturate(1.8);
		border-right: 1px solid var(--grey-300);		
	}

	aside.open {
		left: 0;
	}

	div.nav-footer {
		display: none 
	}

}

</style>