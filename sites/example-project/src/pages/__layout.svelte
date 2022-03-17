<script>
	import "../app.css"
	import { navigating } from '$app/stores';
	import Nav from '@evidence-dev/components/ui/Nav.svelte';
	import BreadCrumbs from '@evidence-dev/components/ui/BreadCrumbs.svelte';
	import LoadingIndicator from '@evidence-dev/components/ui/LoadingIndicator.svelte';
	import { blur, fade } from "svelte/transition"
	import Logo from "@evidence-dev/components/ui/Logo.svelte";
	import TableOfContents from "$lib/TableOfContents.svelte";
</script>

<svelte:head>
	<title>Evidence</title>
</svelte:head>

<div class="grid">
	<header>
	  <BreadCrumbs/>
	</header>
	<aside class=sidebar>
	  <div class="sticky">
		<h1 href="/">Spectre Energy</h1>
		<nav>
		  <ul>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
			<li>Nav Item</li>
		  </ul>
		</nav>
		<div class=side-bar-bottom>
			<h1>Bottom stuff</h1>
		</div>
	  </div>
	</aside>
	<main>
	  <div class=content>
		{#if !$navigating}
		<article in:blur>
			<slot/>
		</article>
		{/if}
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

header {
  grid-area: header;
  position: sticky;
  z-index: 2;
  top: 0;
  display: grid;
  place-content: center;
  height: var(--header-height);
  /* border-bottom: 3px solid; */
  background-color: rgba(255, 255, 255, 1);

}

/*
  The “aside” child is positioned according to
  grid layout, filling the assigned grid area.
*/
aside.sidebar {
  grid-area: sidebar;
  position: relative;
  z-index: 1;
  background-color: var(--grey-100);
  border-right: 1px solid var(--grey-300);
  
  /* color: white; */
  /* border: 3px solid; */

}

.sticky {
	position: sticky;
  	top: 0;
	padding: 1em;
}

nav {
	max-height: 75vh;
	overflow-y: scroll;
}

main {
  grid-area: main;
  /* border: 3px solid; */
}

div.content { 
	margin: auto;
	max-width:100ch;
	box-sizing: border-box;
	display: grid;
	/* border: 3px solid red; */
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
	/* border: 3px solid yellow; */
}

aside.toc {
	grid-area: toc;
	padding: 0px;

	/* border: 3px solid; */
}


</style>