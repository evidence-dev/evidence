<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import TabDisplay from './TabDisplay.svelte';

	export let id;
	export let color = 'hsla(207, 65%, 39%, 1)';

	/** @type {import('./index.d.ts').TabsContext} */
	const context = writable({ tabs: [], active: null });

	onMount(() => {
		const url = new URL(window.location.href);
		const urlActive = url.searchParams.get(id);
		if (urlActive) {
			$context.active = urlActive;
		}
	});

	$: if (!$context.activeId && $context.tabs.length) {
		$context.activeId = $context.tabs[0].id;
	}

	$: if (!$context.tabs.find((t) => t.id === $context.activeId)) {
		$context.activeId = $context.tabs[0]?.id;
	}

	$: if ($context.activeId && id) {
		const url = new URL(window.location.href);
		url.searchParams.set(id, $context.activeId);
		history.replaceState({}, '', url);
	}

	setContext('TABS_STORE', context);

	const handleTabClick = (id) => {
		console.log('handleTabClick', id);
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
				on:click={handleTabClick(tab.id)}
			>
				<slot />
			</TabDisplay>
		{/each}
	</nav>
	<div class="text-base">
		<slot />
	</div>
</section>
