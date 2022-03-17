<script>
	import "../app.css"
	import TableOfContents from "$lib/TableOfContents.svelte";
	import Header from '$lib/ui/Header.svelte'
</script>

<svelte:head>
	<title>Evidence</title>
</svelte:head>

<div class="grid">
	<Header/>
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


</style>