<script context="module">
	// Build nav links
	const rootMDFiles = import.meta.glob('/src/pages/*.md');
	const levelOneIndexFiles = import.meta.glob('/src/pages/*/index.md');
	const levelOneMDFiles = import.meta.glob('/src/pages/*/*.md');
	const levelTwoIndexFiles = import.meta.glob('/src/pages/*/*/index.md');

	let menu = [];
	let pathEnd;
	let pathSplit;

	for(let path in rootMDFiles) {
		pathEnd = path.replace('/src/pages/', '').replace(/^\.\//, '')
		menu.push({
			filename: pathEnd,
			label: pathEnd.replace(/\.md$/, '').replace(/_/g, ' ').replace(/-/g, ' '),
			href: "/" + pathEnd.replace(/^index\.md/, '').replace(/\.md$/, ''),
			hrefUri: encodeURI("/" + pathEnd.replace(/^index\.md/, '').replace(/\.md$/, '')),
			folder: undefined,
			folderLabel: undefined,
			folderHref: undefined,
			folderHrefUri: undefined,
			nameError: pathEnd.includes(" "),
			folderNameError: undefined
		})
	}

	for(let path in levelOneIndexFiles) {
		pathEnd = path.replace('/src/pages/', '').replace(/^\.\//, '')
		pathSplit = pathEnd.split("/")
		menu.push({
			filename: pathSplit[1],
			label: pathSplit[0].replace(/_/g, ' ').replace(/-/g, ' '),
			href: "/" + pathSplit[0],
			hrefUri: encodeURI("/" + pathSplit[0]),
			folder: pathSplit[0],
			folderLabel: pathSplit[0].replace(/_/g, ' ').replace(/-/g, ' '),
			folderHref: "/" + pathSplit[0],
			folderHrefUri: encodeURI("/" + pathSplit[0]),
			nameError: pathEnd.includes(" "),
			folderNameError: pathSplit[0].includes(" ")
		})
	}

	for(let path in levelOneMDFiles) {
		pathEnd = path.replace('/src/pages/', '').replace(/^\.\//, '')
		pathSplit = pathEnd.split("/")
		if(!path.includes("/index.md") && !path.includes("[")){
			menu.push({
				filename: pathSplit[1],
				label: pathSplit[1].replace(/\.md$/, '').replace(/_/g, ' ').replace(/-/g, ' ').replace(/.*\//,''),
				href: "/" + pathEnd.replace(/\.md$/, ''),
				hrefUri: encodeURI("/" + pathEnd.replace(/\.md$/, '')),
				folder: pathSplit[0],
				folderLabel: pathSplit[0].replace(/_/g, ' ').replace(/-/g, ' '),
				folderHref: "/" + pathEnd.replace(/\.md$/, '').replace(/^\.\//, '').replace(/\/([^\/]+)$/, ''),
				folderHrefUri: encodeURI("/" + pathSplit[0]),
				nameError: pathEnd.includes(" "),
				folderNameError: pathSplit[0].includes(" ")
			})
		}
	} 

	for(let path in levelTwoIndexFiles) {
		pathEnd = path.replace('/src/pages/', '').replace(/^\.\//, '')
		pathSplit = pathEnd.split("/")
		menu.push({
			filename: pathSplit[2],
			label: pathSplit[1].replace(/_/g, ' ').replace(/-/g, ' '),
			href: "/" + pathSplit[0] + "/" + pathSplit[1],
			hrefUri: encodeURI("/" + pathSplit[0] + "/" + pathSplit[1]),
			folder: pathSplit[0],
			folderLabel: pathSplit[0].replace(/_/g, ' ').replace(/-/g, ' '),
			folderHref: "/" + pathSplit[0],
			folderHrefUri: encodeURI("/" + pathSplit[0]),
			nameError: pathEnd.includes(" "),
			folderNameError: pathSplit[0].includes(" ")
		})
	}

</script>

<script>
    import { page } from '$app/stores';
	import { dev } from '$app/env';
	import CollapsibleSection from '$lib/ui/CollapsibleSection.svelte'
	import IoMdSettings from 'svelte-icons/io/IoMdSettings.svelte'
	import MdErrorOutline from 'svelte-icons/md/MdErrorOutline.svelte'

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
	let folderNameError;
	
	for(let i = 0; i < folders.length; i++){
		contents = menu.filter(d => d.folder === folders[i]);

		folderLab = contents[0].folderLabel;
		folderHref = contents[0].folderHref;
		folderHrefUri = contents[0].folderHrefUri;
		folderNameError = contents[0].folderNameError;

		fileCount = contents.filter(d => d.href !== folderHref).length;
		folderLink = contents.filter(d => d.href === folderHref).length > 0;
		folderObj = {folder: folders[i], folderLabel: folderLab, folderHref: folderHref, folderHrefUri: folderHrefUri, fileCount: fileCount, folderLink: folderLink, folderNameError: folderNameError}
		folderList.push(folderObj)
	}

	// Keep only folders with at least 1 page that is not index.md or a parameterized page (path contains '[')
	folderList = folderList.filter(d => d.fileCount > 0)
	let folderCheck = [];
	for(let i = 0; i < folderList.length; i++){
		folderCheck.push(folderList[i].folder)
	}

	let noFolders = menu.filter(d => d.folder === undefined || !folderCheck.includes(d.folder))
	noFolders = noFolders.sort((a, b) => {
        return (a.label < b.label ? -1 : 1)
    });

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
                {#if item.href !== '/'}
					{#if dev && item.nameError}
						<a href={item.href} sveltekit:prefetch on:click={() => open = !open} style="">
							<div class=name-error class:selected="{"/"+$page.path.split('/')[1] === item.href}">
								<span class="alert-icon">
									<MdErrorOutline/>
									<span class=info-msg>Filenames cannot include spaces. Use hyphens instead.</span>
								</span>
								{item.label}
							</div>
						</a>
					{:else}
						<a href={item.href} sveltekit:prefetch on:click={() => open = !open} style="">
							<div class:selected="{"/"+$page.path.split('/')[1] === item.hrefUri}">
								{item.label}
							</div>
						</a>
					{/if}
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

.name-error, .name-error:hover {
	color: var(--red-600);
}

span.alert-icon {
        width: 18px;
        color:var(--red-600);
        display:inline-block;
        vertical-align: middle;
        line-height: 1em;
        cursor: help;
        position:relative;
        text-transform: none;
    }

	.alert-icon .info-msg {
        visibility: hidden;
        position: absolute;
        top: -5px;
        left: 105%;
		min-width: 200px;
        padding-left: 5px;
        padding-right: 5px;     
        padding-top: 2px;
        padding-bottom: 1px;   
        color: white;
        font-family: sans-serif;
        font-size: 0.8em;
        background-color: var(--grey-900);
        opacity: 0.85;
        border-radius: 6px;
        z-index: 1;
    }

    .name-error:hover .info-msg {
        visibility: visible;
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