<script context="module">
	// Build nav links
	const rootMDFiles = import.meta.glob('/src/pages/*.md');
	const levelOneIndexFiles = import.meta.glob('/src/pages/*/index.md');
	const levelOneMDFiles = import.meta.glob('/src/pages/*/*.md');

	let menu = [];

	for(let path in rootMDFiles) {
		menu.push({
			label: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' '),
			href: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('index','/'),
			folder: undefined
		})
	}

	for(let path in levelOneIndexFiles) {
		menu.push({
			label: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' ').replaceAll('/index',''),
			href: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index',''),
			folder: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('/index',''),
		})
	}

	for(let path in levelOneMDFiles) {
		if(!path.includes("/index.md") && !path.includes("[")){
			menu.push({
				label: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' ').replaceAll('/index','').replace(/.*\//,''),
				href: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index',''),
				folder: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replace(/^\.\//, '').replace(/\/([^\/]+)$/, '').replaceAll('/index',''),
			})
		}
	} 
</script>

<script>
    import { page } from '$app/stores';
	import { dev } from '$app/env';
	import CollapsibleSection from '$lib/ui/CollapsibleSection.svelte'

	export const load = async() => {
		const menu = await Promise.all(menu)
		return { props: { menu } }
	}

	let folders = [...new Set(menu.map(item => item.folder))];
	folders = folders.filter(d => d !== undefined);

	let fileCount;
	let folderList = [];
	let folderObj;
	let folderLink;
	let contents;
	for(let i = 0; i < folders.length; i++){
		contents = menu.filter(d => d.folder === folders[i]);
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

	let noFolders = menu.filter(d => d.folder === undefined || !folderCheck.includes(d.folder))

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

			<a href='/settings' class="settings-link" class:selected="{$page.path === '/settings'}">
				<div class="settings-icon" href='/settings'>				
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22">
						<path d="M413.967 276.8c1.06-6.235 1.06-13.518 1.06-20.8s-1.06-13.518-1.06-20.8l44.667-34.318c4.26-3.118 5.319-8.317 2.13-13.518L418.215 115.6c-2.129-4.164-8.507-6.235-12.767-4.164l-53.186 20.801c-10.638-8.318-23.394-15.601-36.16-20.801l-7.448-55.117c-1.06-4.154-5.319-8.318-10.638-8.318h-85.098c-5.318 0-9.577 4.164-10.637 8.318l-8.508 55.117c-12.767 5.2-24.464 12.482-36.171 20.801l-53.186-20.801c-5.319-2.071-10.638 0-12.767 4.164L49.1 187.365c-2.119 4.153-1.061 10.399 2.129 13.518L96.97 235.2c0 7.282-1.06 13.518-1.06 20.8s1.06 13.518 1.06 20.8l-44.668 34.318c-4.26 3.118-5.318 8.317-2.13 13.518L92.721 396.4c2.13 4.164 8.508 6.235 12.767 4.164l53.187-20.801c10.637 8.318 23.394 15.601 36.16 20.801l8.508 55.117c1.069 5.2 5.318 8.318 10.637 8.318h85.098c5.319 0 9.578-4.164 10.638-8.318l8.518-55.117c12.757-5.2 24.464-12.482 36.16-20.801l53.187 20.801c5.318 2.071 10.637 0 12.767-4.164l42.549-71.765c2.129-4.153 1.06-10.399-2.13-13.518l-46.8-34.317zm-158.499 52c-41.489 0-74.46-32.235-74.46-72.8s32.971-72.8 74.46-72.8 74.461 32.235 74.461 72.8-32.972 72.8-74.461 72.8z"></path>
					</svg>
				</div>
				<a class="settings-label" href='/settings'>				
					Settings
				</a>
			</a>
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
	color:var(--grey-700);
	display: inline-block;
	text-decoration: none;
	font-family: var(--ui-font-family);
	-webkit-font-smoothing: antialiased;
}

nav a {
	font-size: 15px;
	display: block;
	color: var(--grey-700);
}

nav div {
	padding: 0.2rem 1rem 0.2rem 1.2rem;
	/* transition-property: background-color;
	transition-duration: 400ms; */
}

nav div:hover {
	/* background-color: var(--grey-200); */
	color: var(--grey-900)
	/* transition-property: background-color;
	transition-duration: 400ms; */
}

nav a:hover {
	text-decoration: none;
	background-color: none;
	text-decoration: none;
}

div.selected {
	/* background-color: var(--grey-200); */
	color: var(--blue-600);
	font-weight: 500;
}

div.selected:hover {
	color: var(--blue-800);
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
	display: flex;

	font-size: 16px;
}

.settings-link {
	display: grid;
	grid-template-columns: 2rem auto;
}

.settings-label {
	color: var(--grey-700);
}

.settings-link:hover .settings-icon {
	fill: var(--grey-700);
}

.settings-link:hover a {
	color: var(--grey-900);
}

.settings-link.selected a {
	color: var(--blue-600);
}

.settings-link.selected .settings-icon {
	fill: var(--blue-600);
}

.settings-icon {
	/* padding: 0.2rem 1rem 1.2rem 0.5rem; */
	/* padding: 0.05rem 10rem 1.2rem 0.1rem; */
	padding: 0.082rem 0rem 0rem 0.5rem;
	fill: var(--grey-500);
}


.nav-footer a {
	/* display:block; */
	color: var(--grey-700);
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