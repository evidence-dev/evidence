<script>
	import { onMount, onDestroy } from 'svelte';
	import { fly } from 'svelte/transition';

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

<div class="doc-tab mt-5">
	<div class="flex relative w-fit">
		{#each tabs as tab, index}
			<button
				class="p-1 cursor-pointer transition-colors duration-300 text-xs font-semibold ease-in-out capitalize {activeTab ===
				tab
					? 'text-black'
					: 'text-gray-600'}"
				on:click={() => setTab(tab, index)}
				bind:this={tabButtons[index]}
			>
				{tab}
			</button>
		{/each}
		<div
			style="width: {activeBorderStyles.width}; transform: {activeBorderStyles.transform};"
			class="absolute bottom-0 left-0 h-[2px] bg-black transition-[width, transform] duration-300 ease-in-out"
		></div>
	</div>

	<div bind:this={tabContent} class="overflow-hidden">
		{#if activeTab === 'preview'}
			<div
				in:fly={{ y: -100, duration: 300, delay: 300 }}
				out:fly={{ y: -100, duration: 300 }}
				class="transition-height ease-in-out duration-300 my-5"
			>
				<slot name="preview" />
			</div>
		{:else}
			<div
				in:fly={{ y: -100, duration: 300, delay: 300 }}
				out:fly={{ y: -100, duration: 300 }}
				class="transition-height ease-in-out duration-300"
			>
				<slot />
			</div>
		{/if}
	</div>
</div>
