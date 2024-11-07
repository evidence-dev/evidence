<script>
	import { onMount } from 'svelte';

	let activeTab = 'preview';
	let activeBorderStyles = {};

	const tabs = ['preview', 'code'];
	let tabButtons = [];
	let tabButton;

	onMount(() => {
		updateActiveBorder(0);
	});

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
</script>

<div class="doc-tab mt-2 overflow-hidden">
	<div class="flex relative w-fit">
		{#each tabs as tab, index}
			<button
				class="p-1 px-2 cursor-pointer transition-colors duration-300 text-xs font-semibold ease-in-out capitalize tracking-wide {activeTab ===
				tab
					? 'text-black'
					: 'text-gray-500'}"
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
		<div
			class="mt-2 mb-3 overflow-hidden col-start-1 col-end-2 row-start-1 row-end-2 transition-[max-height] ease-in-out duration-3000"
			class:invisible={activeTab !== 'preview'}
			class:slide-in={activeTab === 'preview'}
			class:slide-out={activeTab !== 'preview' && activeTab === 'code'}
			class:slide-out-right={activeTab !== 'preview' && activeTab !== 'code'}
		>
			<slot name="preview" />
		</div>
		<div
			class="overflow-auto md-preview col-start-1 col-end-2 row-start-1 row-end-2 transition-[max-height] ease-in-out duration-3000"
			class:invisible={activeTab !== 'code'}
			class:slide-in={activeTab === 'code'}
			class:slide-out-right={activeTab !== 'code' && activeTab === 'preview'}
			class:slide-out={activeTab !== 'code' && activeTab !== 'preview'}
		>
			<slot />
		</div>
	</div>
</div>

<style>
	.slide-out {
		margin: 0;
		opacity: 0;
		height: 0;
		overflow: hidden;
		transform: translateX(-100%);
		transition:
			opacity 0.5s ease,
			transform 0.5s ease;
	}

	.slide-in {
		opacity: 1;
		transform: translateX(0);
		transition:
			opacity 0.5s ease,
			transform 0.5s ease;
	}

	.slide-out-right {
		margin: 0;
		opacity: 0;
		height: 0;
		overflow: hidden;
		transform: translateX(100%);
		transition:
			opacity 0.5s ease,
			transform 0.5s ease;
	}

	/* Style only the codeblocks in the md-preview */
	:global(.md-preview > div:first-of-type) {
		margin-top: 0.5rem !important;
		margin-bottom: 0.75rem !important;
	}
</style>
