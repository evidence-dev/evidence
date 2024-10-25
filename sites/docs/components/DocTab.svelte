<script>
	import { afterUpdate, onMount, onDestroy } from 'svelte';
	import { toCapitilize } from '../../../packages/ui/core-components/src/lib/utils.js';

	let activeTab = 'preview';
	let activeBorderStyles = {};
	let tabContentHeight = '0px';

	const tabs = ['preview', 'code'];
	let tabButtons = [];
	let tab;
	let tabButton;
	let resizeObserver;

	let componentHeight = 0;
	let codeHeight = 0;

	function setTab(tab, index) {
		activeTab = tab;
		updateActiveBorder(index);
		updateTabContentHeight();
	}

	function updateActiveBorder(index) {
		tabButton = tabButtons[index];
		activeBorderStyles = {
			width: `${tabButton.offsetWidth}px`,
			transform: `translateX(${tabButton.offsetLeft}px)`
		};
	}

	function updateTabContentHeight() {
		tabContentHeight = activeTab === 'preview' ? `${componentHeight}px` : `${codeHeight}px`;
	}

	onMount(() => {
		componentHeight = tab.scrollHeight;
		updateTabContentHeight();

		resizeObserver = new ResizeObserver(() => {
			const index = tabs.indexOf(activeTab);
			if (index !== -1) updateActiveBorder(index);
		});

		tabButtons.forEach((button) => resizeObserver.observe(button));
	});

	afterUpdate(() => {
		const index = tabs.indexOf(activeTab);
		updateActiveBorder(index);
		codeHeight = tab.scrollHeight;
		updateTabContentHeight();
	});

	onDestroy(() => {
		tabButtons.forEach((button) => resizeObserver.unobserve(button));
	});
</script>

<div class="doc-tab">
	<div class="flex relative w-fit">
		{#each tabs as tab, index}
			<button
				class="p-1 cursor-pointer transition-colors duration-300 text-xs font-semibold ease-in-out {activeTab ===
				tab
					? 'text-black'
					: 'text-gray-600'}"
				on:click={() => setTab(tab, index)}
				bind:this={tabButtons[index]}
			>
				{toCapitilize(tab)}
			</button>
		{/each}
		<div
			style="width: {activeBorderStyles.width}; transform: {activeBorderStyles.transform};"
			class="absolute bottom-0 left-0 h-[2px] bg-black transition-[width, transform] duration-300 ease-in-out"
		></div>
	</div>

	<div
		bind:this={tab}
		style="height: {tabContentHeight};"
		class="transition-height overflow-hidden ease-in-out duration-300 {}"
	>
		{#if activeTab === 'preview'}
			<div class="my-5">
				<slot name="preview" />
			</div>
		{:else}
			<slot />
		{/if}
	</div>
</div>
