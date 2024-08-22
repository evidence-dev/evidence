<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const classes = {
		notActive:
			'border-border text-muted-foreground border-b-2 bg-muted hover:text-foreground hover:bg-secondary hover:border-b-primary',
		active: 'text-foreground border-b-2 border-primary bg-background'
	};

	/**
	 * id can be provided to enable tab selection to persist across reloads (e.g. with query params)
	 * @type {string}
	 */
	export let id;

	/** @type {import('./index.d.ts').TabsContext} */
	const context = writable({ tabs: [], active: null });

	onMount(() => {
		const url = new URL(window.location.href);
		const urlActive = url.searchParams.get(id);
		if (urlActive) {
			$context.active = urlActive;
		}
	});

	// Select the first tab by default
	$: if (!$context.activeId && $context.tabs.length) {
		$context.activeId = $context.tabs[0].id;
	}

	// Select the first tab when the active tab no longer exists
	$: if (!$context.tabs.find((t) => t.id === $context.activeId)) {
		$context.activeId = $context.tabs[0]?.id;
	}

	$: if ($context.activeId && id) {
		// Keep the Query in sync
		const url = new URL(window.location.href);
		url.searchParams.set(id, $context.activeId);
		history.replaceState({}, '', url);
	}

	setContext('TABS_STORE', context);
</script>

<section>
	<nav class="my-6 flex flex-wrap gap-x-1 gap-y-1">
		{#each $context.tabs as tab}
			<button
				on:click={() => ($context.activeId = tab.id)}
				class="mt-2 p-2 rounded-t flex-1 text-sm font-sans whitespace-nowrap transition ease-in duration-200 {$context.activeId ===
				tab.id
					? classes.active
					: classes.notActive}"
			>
				{tab.label}
			</button>
		{/each}
	</nav>
	<div class="text-foreground">
		<slot />
	</div>
</section>
