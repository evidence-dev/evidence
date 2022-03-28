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
	import { navigating } from '$app/stores';
	import { blur } from "svelte/transition"

	import TableOfContents from "@evidence-dev/components/TableOfContents.svelte";
	import Header from '@evidence-dev/components/ui/Header.svelte'
	import Hamburger from '@evidence-dev/components/ui/Hamburger.svelte'
	import Sidebar from '@evidence-dev/components/ui/Sidebar.svelte'
	import LoadingIndicator from "@evidence-dev/components/ui/LoadingIndicator.svelte";

	export let menu;
	export let open = false  
</script>

<svelte:head>
	<title>Evidence</title>
</svelte:head>

{#if $navigating}
	<LoadingIndicator/>
{/if}

<div class="grid">
	<Header/>
	<Sidebar bind:open {menu}/> 
	<Hamburger bind:open/>
	<main in:blur|local>
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
}

</style>