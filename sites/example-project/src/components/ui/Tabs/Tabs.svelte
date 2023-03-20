<script>
	import {setContext} from "svelte";
	import {writable} from "svelte/store";
	
	/**
	 * @type {import("svelte/store").Writable<{ tabs: {label: string, id: string}[], active: string}>}
	 */
	const tabItems = writable({tabs: [], active: null})
	
    // Select the first tab by default
    $: if(!$tabItems.active && $tabItems.tabs.length) 
        $tabItems.active = $tabItems.tabs[0].id

	setContext("TAB_REGISTRATION", tabItems)
</script>
<section>
	<nav class="flex gap-4">
		{#each $tabItems.tabs as tab}
			<button on:click={() => $tabItems.active = tab.id} 
                class="px-4 pt-2 border-b-2 border-blue-300"
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
        @apply px-4 py-2 border-b-2 border-transparent
         hover:bg-gray-200
         active:bg-gray-100
        transition-colors rounded-t;

        &.active {
            @apply border-green-500
            hover:border-green-600 hover:bg-gray-200
            active:border-green-700 active:bg-gray-100
        }
    }
</style>