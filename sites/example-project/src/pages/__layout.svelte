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
	import Logo from '$lib/ui/Logo.svelte'
	import { page } from '$app/stores';
	import { dev } from '$app/env';

	export let menu;
</script>

<svelte:head>
	<title>Evidence</title>
</svelte:head>

<div class="grid">
	<Header/>
	<aside class=sidebar>
		<div class="sticky">
			<div class=nav-header>
				<a href='/'><h1 class=project-title>Evidence</h1></a>
			</div>
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
			{#if dev}
			<div class="nav-footer">
				<a href='/settings'>Settings</a>
			</div>
			{/if}
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

aside.sidebar {
  grid-area: sidebar;
  position: relative;
  z-index: 1;
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
	grid-template-rows: 3em 1fr 4em;
	grid-template-areas: 
	'header'
	'nav'
	'footer'
	;
}



nav {
    overflow-y: scroll;
	overflow-x: hidden;
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
	width: 100%;
	padding: 0.2em 1em 0.2em 1em;
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
	padding: 0.2em 1em 1.2em 1em;
	grid-area: header;
}

div.nav-header a {
	display: block;
}

.nav-footer {
	padding: 1.2em 1em 1.2em 1em;
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

@media (max-width: 1440px) {
	div.content { 
		grid-template-columns: 1fr;
		grid-template-areas:
			'article'; 
	}

	article {
		max-width: 80ch;
	}

	aside.toc {
		display: none;
	}
}

@media (max-width: 850px) {
	.grid {
		display: grid;
		grid-template-areas:
			'header'
			'main';
		grid-template-columns: 1fr;
		grid-template-rows: var(--header-height) 1fr;
		margin: 0 auto;
		isolation: isolate;
	}

	div.content { 
		margin: auto;
		max-width:100ch;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-areas:
			'article'; 
		justify-items: center;
	}

	aside.sidebar {
		display: none;
	}
}

</style>