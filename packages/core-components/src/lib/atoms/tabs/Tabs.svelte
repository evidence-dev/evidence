<script>
	import * as BaseTabs from '../shadcn/tabs/index.js';

	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	let tabItems = writable([]);

	/** @type {boolean} */
	export let well = false;

	setContext('TAB_REGISTRATION', tabItems);
</script>

<BaseTabs.Root>
	<BaseTabs.List {well}>
		{#each $tabItems as value}
			<BaseTabs.Trigger {value} {well}>{value}</BaseTabs.Trigger>
		{/each}
	</BaseTabs.List>
	<slot />
</BaseTabs.Root>
