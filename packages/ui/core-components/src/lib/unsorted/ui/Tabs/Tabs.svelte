<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import TabDisplay from './TabDisplay.svelte';

	export let id;
	export let color = undefined;

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

	setContext('TABS_STORE', context);

	const handleTabClick = (id) => {
		$context.activeId = id;
	};
</script>

<section>
	<nav class="my-6 flex flex-wrap gap-x-1 gap-y-1">
		{#each $context.tabs as tab}
			<TabDisplay
				id={tab.id}
				label={tab.label}
				{color}
				activeId={$context.activeId}
				on:click={() => handleTabClick(tab.id)}
			>
				<slot />
			</TabDisplay>
		{/each}
	</nav>
	<div class="text-base">
		<slot />
	</div>
</section>
