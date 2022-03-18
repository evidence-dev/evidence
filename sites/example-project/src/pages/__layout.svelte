<script context = "module">

	// Build nav links
	const rootMDFiles = import.meta.glob('./*.md');
	const levelOneIndexFiles = import.meta.glob('./*/index.md');

	let allmenu = [];

	for(let path in rootMDFiles) {
		allmenu.push({
			label: path.replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' '),
			href: path.replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('index','/'),
		})
	}

	for(let path in levelOneIndexFiles) {
		allmenu.push({
			label: path.replace(/^\.\//, '').replace(/\.md$/, '').replaceAll('_', ' ').replaceAll('-', ' ').replaceAll('/index',''),
			href: path.replace(/^\.\//, '/').replace(/\.md$/, '').replaceAll('/index',''),
		})
	}

	export const load = async() => {
		const menu = await Promise.all(allmenu)
		return { props: { menu } }
	}

</script>

<script>
	import "../app.css"
	import TableOfContents from "$lib/TableOfContents.svelte";
	import Header from '$lib/ui/Header.svelte'
	import SidebarNav from '$lib/ui/Sidebarnav.svelte'
	import { page } from '$app/stores';

	export let menu;
</script>

<svelte:head>
	<title>Evidence</title>
</svelte:head>

<div class="grid">
	<Header/>
	<aside class=sidebar>
		<div class="sticky">
			<h1><a href='/'>Evidence</a></h1>
			<br/>
			<nav>
				{#each menu as item}
					{#if item.label != 'index'}
					<a href={item.href} sveltekit:prefetch >
						<div class:selected="{"/"+$page.path.split('/')[1] === item.href}" >
							{item.label}
						</div>
					</a>
					{/if}
				{/each}
			</nav>
			<div class=side-bar-bottom>
				<h1>Bottom stuff</h1>
			</div>
		</div>			
	</aside>
	<main>
	  <div class=content>
		<article>
			<slot/>
		</article>
		<aside class='toc'>
			<TableOfContents/>
		</aside>
	  </div>
	</main>
</div>

<style>
.grid {
  display: grid;
  grid-template-areas:
    'sidebar header'
    'sidebar main';
  grid-template-columns: 20rem 5fr;
  grid-template-rows: var(--header-height) 1fr;
  gap: 0 16px;
  margin: 0 auto;
  isolation: isolate;
}

aside.sidebar {
  grid-area: sidebar;
  position: relative;
  z-index: 1;
  background-color: var(--grey-100);
  border-right: 1px solid var(--grey-300);
}

main {
  grid-area: main;
}

div.content { 
	margin: auto;
	max-width:100ch;
	box-sizing: border-box;
	display: grid;
	grid-template-columns: 4fr minmax(0,1fr);
	gap: 0 5ch;
  	grid-template-areas:
    	'article toc'; 
    justify-items: left;
}

article {
	max-width: 70ch;
	min-width: 0;
	width: 100%;
	grid-area: article;
	padding: 0 1.5em 0 1.5em;
	box-sizing: border-box;
}

aside.toc {
	grid-area: toc;
	padding: 0px;
}

.sticky {
    position: sticky;
    top: 0;
    padding: 0;
}

nav {
    min-height: 85vh;
    overflow-y: scroll;
	overflow-x: hidden;
}

a {
	text-transform: capitalize;
	color:var(--grey-999);
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
	width: 100%;
	background-color: var(--grey-100);
	border-top: 1px solid var(--grey-100);
	border-bottom: 1px solid var(--grey-100);
	padding: 0.1em 1em 0 1em;
}

nav a:hover {
	text-decoration: none;
	background-color: none;
	text-decoration: none;
	color: var(--blue-600);
	transition-property: color;
	transition-duration: 600ms;
}

div.selected {
	background-color: var(--grey-200);
	border-top: 1px solid var(--grey-300);
	border-bottom: 1px solid var(--grey-300);
}



</style>