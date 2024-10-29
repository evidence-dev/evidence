<script>
	import { onMount, onDestroy, afterUpdate } from 'svelte';
	import { slide } from 'svelte/transition';

	let activeTab = 'preview';
	let activeBorderStyles = {};

	const tabs = ['preview', 'code'];
	let tabButtons = [];
	let tabButton;
	let tabContent;
	let resizeObserver;
	let resizeHeightObserver;

	function setTab(tab, index) {
		activeTab = tab;
		updateActiveBorder(index);
	}

	function updateActiveBorder(index) {
		tabButton = tabButtons[index];
		activeBorderStyles = {
			width: `${tabButton.offsetWidth}px`,
			transform: `translateX(${tabButton.offsetLeft}px)`
		};
	}

	onMount(() => {
		resizeObserver = new ResizeObserver(() => {
			const index = tabs.indexOf(activeTab);
			if (index !== -1) updateActiveBorder(index);
		});

		tabButtons.forEach((button) => resizeObserver.observe(button));

		resizeHeightObserver = new ResizeObserver(() => {
			console.log(tabContent.scrollHeight);
		});
	});

	onDestroy(() => {
		tabButtons.forEach((button) => resizeObserver.unobserve(button));
	});
</script>

<div class="doc-tab mt-2">
	<div class="flex relative w-fit">
		{#each tabs as tab, index}
			<button
				class="p-1 cursor-pointer transition-colors duration-300 text-sm font-semibold ease-in-out capitalize font-mono tracking-wide {activeTab ===
				tab
					? 'text-black'
					: 'text-gray-600'}"
				on:click={() => setTab(tab, index)}
				bind:this={tabButtons[index]}
			>
				{tab}
			</button>
		{/each}

		<!-- Active tab border indicator -->
		<div
			style="width: {activeBorderStyles.width}; transform: {activeBorderStyles.transform};"
			class="absolute bottom-0 left-0 h-[2px] bg-black transition-[width, transform] duration-300 ease-in-out"
		></div>
	</div>
	<div class="border-b border-gray-300 w-full"></div>

	<div class="overflow-hidden grid">
		{#if activeTab === 'preview'}
			<div
				transition:slide={{ duration: 300 }}
				class="my-5 border-gray-300 border p-3 shadow rounded backdrop-blur-sm bg-gray-50/10 overflow-x-auto"
			>
				<slot name="preview" />
			</div>
		{:else}
			<div transition:slide={{ duration: 300 }} class="overflow-auto shadow">
				<slot />
			</div>
		{/if}
	</div>
</div>
