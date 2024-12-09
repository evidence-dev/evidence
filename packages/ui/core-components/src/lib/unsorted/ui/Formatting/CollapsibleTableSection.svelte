<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { slide } from 'svelte/transition';
	import ChevronToggle from '../ChevronToggle.svelte';
	export let headerText;
	export let expanded = true;
	let toggleExpanded = () => {
		expanded = !expanded;
	};
</script>

<div class="collapsibleSection">
	<collapsibleHeader>
		<button area-expanded={expanded} on:click|preventDefault={toggleExpanded}>
			<h3>{headerText}</h3>
			<ChevronToggle toggled={expanded} size="16" />
		</button>
	</collapsibleHeader>
	{#if expanded}
		<div class="collapsibleContents" hidden={!expanded} transition:slide|local>
			<slot />
		</div>
	{/if}
</div>

<style>
	collapsibleHeader {
		margin: 0;
		padding: 0;
		vertical-align: middle;
	}

	h3 {
		margin: 0;
		font-style: normal;
	}

	button {
		font-size: 14px;
		background-color: var(--base-200);
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		width: 100%;
		border: none;
		margin: 0;
		padding: 0.5em 0.5em;
		cursor: pointer;
	}

	.collapsibleContents {
		padding: 0.5em 0.5em 1.5em 0.5em;
	}
	.collapsibleSection {
		padding: 0px;
		margin: 0.5em 0 0 0;
	}
</style>
