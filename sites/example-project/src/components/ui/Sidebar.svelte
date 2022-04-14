<script context="module">
	// Build nav links
	const rootMDFiles = import.meta.glob('/src/pages/*.md');
	const levelOneIndexFiles = import.meta.glob('/src/pages/*/index.md');
	const levelOneMDFiles = import.meta.glob('/src/pages/*/*.md');

	let menu = [];

	for(let path in rootMDFiles) {
		menu.push({
			filename: path.replace('/src/pages/', '').replace(/^\.\//, ''),
			label: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' '),
			href: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('index','/'),
			hrefUri: encodeURI(path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('index','/')),
			folder: undefined,
			folderLabel: undefined,
			folderHref: undefined,
			folderHrefUri: undefined,
		})
	}

	for(let path in levelOneIndexFiles) {
		menu.push({
			filename: path.replace('/src/pages/', '').replace(/^\.\//, '').replaceAll('_', ' ').replaceAll('-', ' ').replace(/.*\//,''),
			label: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('/index',''),
			href: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index',''),
			hrefUri: encodeURI(path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index','')),
			folder: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('/index',''),
			folderLabel: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' ').replaceAll('/index',''),
			folderHref: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index',''),
			folderHrefUri: encodeURI(path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index','')),
		})
	}

	for(let path in levelOneMDFiles) {
		if(!path.includes("/index.md") && !path.includes("[")){
			menu.push({
				filename: path.replace('/src/pages/', '').replace(/^\.\//, '').replaceAll('/index','').replace(/.*\//,''),
				label: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' ').replaceAll('/index','').replace(/.*\//,''),
				href: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index',''),
				hrefUri: encodeURI(path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index','')),
				folder: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replace(/^\.\//, '').replace(/\/([^\/]+)$/, '').replaceAll('/index',''),
				folderLabel: path.replace('/src/pages/', '').replace(/^\.\//, '').replace(/\.md$/, '').replace(/^\.\//, '').replace(/\/([^\/]+)$/, '').replaceAll('_', ' ').replaceAll('-', ' ').replaceAll('/index',''),
				folderHref: path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replace(/^\.\//, '').replace(/\/([^\/]+)$/, '').replaceAll('/index',''),
				folderHrefUri: encodeURI(path.replace('/src/pages', '').replace(/^\.\//, '/').replace(/\.md$/, '').replace(/^\.\//, '').replace(/\/([^\/]+)$/, '').replaceAll('/index','')),
			})
		}
	} 
</script>

<script>
    import { page } from '$app/stores';
	import { dev } from '$app/env';
	import CollapsibleSection from '$lib/ui/CollapsibleSection.svelte'
	import IoMdSettings from 'svelte-icons/io/IoMdSettings.svelte'

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

	let folderLab;
	let folderHref;
	let folderHrefUri;
	
	for(let i = 0; i < folders.length; i++){
		contents = menu.filter(d => d.folder === folders[i]);

		folderLab = contents[0].folderLabel;
		folderHref = contents[0].folderHref;
		folderHrefUri = contents[0].folderHrefUri;

		fileCount = contents.filter(d => d.href !== folderHref).length;
		folderLink = contents.filter(d => d.href === folderHref).length > 0;
		folderObj = {folder: folders[i], folderLabel: folderLab, folderHref: folderHref, folderHrefUri: folderHrefUri, fileCount: fileCount, folderLink: folderLink}
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
							<div class:selected="{"/"+$page.path.split('/')[1] === item.hrefUri}">
								{item.label}
							</div>
						</a>
                {/if}
            {/each}
            {/if}
			<div class=spacer></div>
        </nav>
        {#if dev}
        <div class="nav-footer">
			<a href='/settings' class="settings-link" class:selected="{$page.path === '/settings'}">
				<span class="settings-icon">
					<IoMdSettings/>
				</span>
				<a class="settings-label" href='/settings'>				
					Settings
				</a>
			</a>
        </div>
        {/if}
    </div>
</aside>

<style>
:root {
	--scrollbar-track-color: transparent;
	--scrollbar-color: rgba(0,0,0,.2);
	--scrollbar-active-color: rgba(0,0,0,.4);
	--scrollbar-size: .75rem;
	--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical)*/
}

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
	scrollbar-width: thin; 
    scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
}

nav::-webkit-scrollbar {
    height: var(--scrollbar-size);
    width: var(--scrollbar-size);
}
nav::-webkit-scrollbar-track {
    background-color: var(--scrollbar-track-color);
}
nav::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-color);
    border-radius: 7px;
    background-clip: padding-box;
}
nav::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-active-color);
}
nav::-webkit-scrollbar-thumb:vertical {
    min-height: var(--scrollbar-minlength);
    border: 3px solid transparent;
}
nav::-webkit-scrollbar-thumb:horizontal {
    min-width: var(--scrollbar-minlength);
    border: 3px solid transparent;
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
}

nav div:hover {
	color: var(--grey-900)
}

nav a:hover {
	text-decoration: none;
	background-color: none;
	text-decoration: none;
}

div.selected {
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

.nav-header {
	overflow: hidden;
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
	color: var(--grey-700);
}

.settings-link:hover a {
	color: var(--grey-900);
}

.settings-link.selected a {
	color: var(--blue-600);
}

.settings-link.selected .settings-icon {
	color: var(--blue-600);
}

.settings-link.selected:hover a {
	color: var(--blue-800);
}

.settings-link.selected:hover .settings-icon {
	color: var(--blue-800);
}

.settings-icon {
	padding: 0.082rem 0rem 0rem 0.5rem;
	color: var(--grey-500);
	height: 22px;
	width: 22px;
}


.nav-footer a {
	color: var(--grey-700);
}

.spacer {
	display: none;
	height: 100px;
	width: 100%;
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
		display: none ;
	}

	.spacer {
		display: block;
	}

}

</style>