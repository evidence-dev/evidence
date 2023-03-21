<script>
	import {onMount, setContext} from "svelte";
	import {writable} from "svelte/store";

	/**
	 * id can be provided to enable tab selection to persist across reloads (e.g. with query params)
	 * @type {string}
	 */
	export let id
	
	/**
	 * @type {import("svelte/store").Writable<{ tabs: {label: string, id: string}[], active: string, tabsId: string}>}
	 */
	const tabItems = writable({tabs: [], active: null})
	
	onMount(() => {
		const url = new URL(window.location.href)
		const urlActive = url.searchParams.get(id)
		if (urlActive) {
			$tabItems.active = urlActive
		}
	})

    $: if(!$tabItems.active && $tabItems.tabs.length) 
    	// Select the first tab by default
		$tabItems.active = $tabItems.tabs[0].id

	$: if ($tabItems.active && id) {
		// Keep the Query in sync
		const url = new URL(window.location.href)
		url.searchParams.set(id, $tabItems.active)
		history.replaceState({}, '', url)
	}

	setContext("TAB_REGISTRATION", tabItems)
</script>
<section>
	<nav class="flex gap-x-4 gap-y-1 flex-wrap mb-2">
		{#each $tabItems.tabs as tab}
			<button on:click={() => $tabItems.active = tab.id}
                class="px-4 pt-2 border-b-2 border-blue-300 text-sm whitespace-nowrap"
                class:active={$tabItems.active === tab.id}>
				{tab.label}
			</button>
		{/each}
	</nav>
	<div>
		<slot/>
	</div>
</section>

<style lang="postcss">
    nav button {
        @apply px-4 py-2 border-b-2 border-b-gray-100 hover:border-b-gray-200
         hover:bg-gray-200
         active:bg-gray-100
        transition-colors rounded-t;

        
    }
	nav button.active {
            @apply border-green-500
            hover:border-green-600 hover:bg-gray-200
            active:border-green-700 active:bg-gray-100
        }
</style>