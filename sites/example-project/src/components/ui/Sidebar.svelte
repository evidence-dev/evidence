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

			<a href='/settings' class="settings-link">
				<div class="settings-icon" href='/settings'>				
					<!-- <svg class="settings-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="var(--grey-500)" fill="var(--grey-500)">
						<path fill-rule="evenodd" d="M16 12a4 4 0 11-8 0 4 4 0 018 0zm-1.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
						<path fill-rule="evenodd" d="M12 1c-.268 0-.534.01-.797.028-.763.055-1.345.617-1.512 1.304l-.352 1.45c-.02.078-.09.172-.225.22a8.45 8.45 0 00-.728.303c-.13.06-.246.044-.315.002l-1.274-.776c-.604-.368-1.412-.354-1.99.147-.403.348-.78.726-1.129 1.128-.5.579-.515 1.387-.147 1.99l.776 1.275c.042.069.059.185-.002.315-.112.237-.213.48-.302.728-.05.135-.143.206-.221.225l-1.45.352c-.687.167-1.249.749-1.304 1.512a11.149 11.149 0 000 1.594c.055.763.617 1.345 1.304 1.512l1.45.352c.078.02.172.09.22.225.09.248.191.491.303.729.06.129.044.245.002.314l-.776 1.274c-.368.604-.354 1.412.147 1.99.348.403.726.78 1.128 1.129.579.5 1.387.515 1.99.147l1.275-.776c.069-.042.185-.059.315.002.237.112.48.213.728.302.135.05.206.143.225.221l.352 1.45c.167.687.749 1.249 1.512 1.303a11.125 11.125 0 001.594 0c.763-.054 1.345-.616 1.512-1.303l.352-1.45c.02-.078.09-.172.225-.22.248-.09.491-.191.729-.303.129-.06.245-.044.314-.002l1.274.776c.604.368 1.412.354 1.99-.147.403-.348.78-.726 1.129-1.128.5-.579.515-1.387.147-1.99l-.776-1.275c-.042-.069-.059-.185.002-.315.112-.237.213-.48.302-.728.05-.135.143-.206.221-.225l1.45-.352c.687-.167 1.249-.749 1.303-1.512a11.125 11.125 0 000-1.594c-.054-.763-.616-1.345-1.303-1.512l-1.45-.352c-.078-.02-.172-.09-.22-.225a8.469 8.469 0 00-.303-.728c-.06-.13-.044-.246-.002-.315l.776-1.274c.368-.604.354-1.412-.147-1.99-.348-.403-.726-.78-1.128-1.129-.579-.5-1.387-.515-1.99-.147l-1.275.776c-.069.042-.185.059-.315-.002a8.465 8.465 0 00-.728-.302c-.135-.05-.206-.143-.225-.221l-.352-1.45c-.167-.687-.749-1.249-1.512-1.304A11.149 11.149 0 0012 1zm-.69 1.525a9.648 9.648 0 011.38 0c.055.004.135.05.162.16l.351 1.45c.153.628.626 1.08 1.173 1.278.205.074.405.157.6.249a1.832 1.832 0 001.733-.074l1.275-.776c.097-.06.186-.036.228 0 .348.302.674.628.976.976.036.042.06.13 0 .228l-.776 1.274a1.832 1.832 0 00-.074 1.734c.092.195.175.395.248.6.198.547.652 1.02 1.278 1.172l1.45.353c.111.026.157.106.161.161a9.653 9.653 0 010 1.38c-.004.055-.05.135-.16.162l-1.45.351a1.833 1.833 0 00-1.278 1.173 6.926 6.926 0 01-.25.6 1.832 1.832 0 00.075 1.733l.776 1.275c.06.097.036.186 0 .228a9.555 9.555 0 01-.976.976c-.042.036-.13.06-.228 0l-1.275-.776a1.832 1.832 0 00-1.733-.074 6.926 6.926 0 01-.6.248 1.833 1.833 0 00-1.172 1.278l-.353 1.45c-.026.111-.106.157-.161.161a9.653 9.653 0 01-1.38 0c-.055-.004-.135-.05-.162-.16l-.351-1.45a1.833 1.833 0 00-1.173-1.278 6.928 6.928 0 01-.6-.25 1.832 1.832 0 00-1.734.075l-1.274.776c-.097.06-.186.036-.228 0a9.56 9.56 0 01-.976-.976c-.036-.042-.06-.13 0-.228l.776-1.275a1.832 1.832 0 00.074-1.733 6.948 6.948 0 01-.249-.6 1.833 1.833 0 00-1.277-1.172l-1.45-.353c-.111-.026-.157-.106-.161-.161a9.648 9.648 0 010-1.38c.004-.055.05-.135.16-.162l1.45-.351a1.833 1.833 0 001.278-1.173 6.95 6.95 0 01.249-.6 1.832 1.832 0 00-.074-1.734l-.776-1.274c-.06-.097-.036-.186 0-.228.302-.348.628-.674.976-.976.042-.036.13-.06.228 0l1.274.776a1.832 1.832 0 001.734.074 6.95 6.95 0 01.6-.249 1.833 1.833 0 001.172-1.277l.353-1.45c.026-.111.106-.157.161-.161z"/>
					</svg> -->

					<!-- <svg class=settings-icon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="25" height="25" fill="var(--grey-400)">
						<path d="M4 7H3V2h1v5zm-1 7h1v-3H3v3zm5 0h1V8H8v6zm5 0h1v-2h-1v2zm1-12h-1v6h1V2zM9 2H8v2h1V2zM5 8H2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1zm5-3H7c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1zm5 4h-3c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1z"></path>
					</svg> -->

					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22">
						<path d="M413.967 276.8c1.06-6.235 1.06-13.518 1.06-20.8s-1.06-13.518-1.06-20.8l44.667-34.318c4.26-3.118 5.319-8.317 2.13-13.518L418.215 115.6c-2.129-4.164-8.507-6.235-12.767-4.164l-53.186 20.801c-10.638-8.318-23.394-15.601-36.16-20.801l-7.448-55.117c-1.06-4.154-5.319-8.318-10.638-8.318h-85.098c-5.318 0-9.577 4.164-10.637 8.318l-8.508 55.117c-12.767 5.2-24.464 12.482-36.171 20.801l-53.186-20.801c-5.319-2.071-10.638 0-12.767 4.164L49.1 187.365c-2.119 4.153-1.061 10.399 2.129 13.518L96.97 235.2c0 7.282-1.06 13.518-1.06 20.8s1.06 13.518 1.06 20.8l-44.668 34.318c-4.26 3.118-5.318 8.317-2.13 13.518L92.721 396.4c2.13 4.164 8.508 6.235 12.767 4.164l53.187-20.801c10.637 8.318 23.394 15.601 36.16 20.801l8.508 55.117c1.069 5.2 5.318 8.318 10.637 8.318h85.098c5.319 0 9.578-4.164 10.638-8.318l8.518-55.117c12.757-5.2 24.464-12.482 36.16-20.801l53.187 20.801c5.318 2.071 10.637 0 12.767-4.164l42.549-71.765c2.129-4.153 1.06-10.399-2.13-13.518l-46.8-34.317zm-158.499 52c-41.489 0-74.46-32.235-74.46-72.8s32.971-72.8 74.46-72.8 74.461 32.235 74.461 72.8-32.972 72.8-74.461 72.8z"></path>
					</svg>

					<!-- <svg class="settings-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 16" width="24" height="24"  fill="var(--grey-400)">
						<path d="M14 8.77v-1.6l-1.94-.64-.45-1.09.88-1.84-1.13-1.13-1.81.91-1.09-.45-.69-1.92h-1.6l-.63 1.94-1.11.45-1.84-.88-1.13 1.13.91 1.81-.45 1.09L0 7.23v1.59l1.94.64.45 1.09-.88 1.84 1.13 1.13 1.81-.91 1.09.45.69 1.92h1.59l.63-1.94 1.11-.45 1.84.88 1.13-1.13-.92-1.81.47-1.09L14 8.75v.02zM7 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"></path>
					</svg> -->

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