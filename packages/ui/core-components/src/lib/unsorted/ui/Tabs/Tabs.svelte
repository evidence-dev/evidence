<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import TabDisplay from './TabDisplay.svelte';
	import { toBoolean } from '../../../utils.js';

	export let id;
	export let color = undefined;
	export let printShowAll = true;
	$: printShowAll = toBoolean(printShowAll);
	let printing = false;

	export let fullWidth = false;
	export let background = false;

	/** @type {import('./index.d.ts').TabsContext} */
	const context = writable({ tabs: [], activeId: null });

	onMount(() => {
		const url = new URL(window.location.href);
		const urlActive = url.searchParams.get(id);
		if (urlActive) {
			//search for urlActive in $context.activeId, if not found, set it to the first tab
			if (!$context.tabs.find((t) => t.id === urlActive)) {
				$context.activeId = $context.tabs[0]?.id;
			} else {
				$context.activeId = urlActive;
			}
		} else {
			$context.activeId = $context.tabs[0]?.id;
		}
	});

	// Select the first tab by default
	$: if (!$context.activeId && $context.tabs.length && !id) {
		$context.activeId = $context.tabs[0].id;
	}

	// Select the first tab when the active tab no longer exists
	$: if (!$context.tabs.find((t) => t.id === $context.activeId) && !id) {
		$context.activeId = $context.tabs[0]?.id;
	}

	$: if ($context.activeId && id) {
		const url = new URL(window.location.href);
		url.searchParams.set(id, $context.activeId);
		history.replaceState({}, '', url);
	}

	$: $context.color = color;
	$: $context.printing = printing;
	$: $context.printShowAll = printShowAll;

	setContext('TABS_STORE', context);

	const handleTabClick = (id) => {
		$context.activeId = id;
	};
</script>

<svelte:window
	on:beforeprint={() => (printing = true)}
	on:afterprint={() => (printing = false)}
	on:export-beforeprint={() => (printing = true)}
	on:export-afterprint={() => (printing = false)}
/>

<section>
	{#if !printing || !printShowAll}
		<nav class="my-5 flex flex-wrap gap-x-0 gap-y-1 border-b">
			{#each $context.tabs as tab}
				<TabDisplay
					id={tab.id}
					label={tab.label}
   				description={tab.description}
					fullWidth={toBoolean(fullWidth)}
					background={toBoolean(background)}
					{color}
					activeId={$context.activeId}
					on:click={() => handleTabClick(tab.id)}
				>
					<slot />
				</TabDisplay>
			{/each}
		</nav>
	{/if}
	<div class="text-base">
		<slot />
	</div>
</section>
