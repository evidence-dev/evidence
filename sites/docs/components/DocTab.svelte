<script>
	import { onMount, afterUpdate } from 'svelte';

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

	let previewHeight = undefined;
	let codeHeight = undefined;
	let previewDiv;
	let codeBlockDiv;

	onMount(() => {
		if (!previewHeight) {
			previewHeight = previewDiv.offsetHeight;
			console.log(previewHeight);
		}

		if (!codeHeight) {
			codeHeight = codeBlockDiv.offsetHeight;
			console.log(codeHeight);
		}
	});
</script>

<div class="doc-tab mt-2 overflow-hidden">
	<div class="flex relative w-fit">
		{#each tabs as tab, index}
			<button
				class="p-1 px-2 cursor-pointer transition-colors duration-300 text-sm font-semibold ease-in-out capitalize tracking-wide {activeTab ===
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

	<div class="overflow-hidden">
		<div
			bind:this={previewDiv}
			class="overflow-hidden {activeTab !== 'preview' ? 'h-[0px]' : 'mb-3 mt-2'}"
			class:invisible={activeTab !== 'preview'}
		>
			<slot name="preview" />
		</div>
		<div
			bind:this={codeBlockDiv}
			class="overflow-auto md-preview {activeTab !== 'code' ? 'h-[0px]' : 'mt-2'}"
			class:invisible={activeTab !== 'code'}
		>
			<slot />
		</div>
	</div>
</div>

<style>
	:global(.md-preview > div:first-of-type) {
		margin: 0;
	}
</style>
