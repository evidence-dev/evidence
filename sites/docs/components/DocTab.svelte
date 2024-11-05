<script>
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	let activeTab = 'preview';
	let activeBorderStyles = {};
	let tabContent;

	const tabs = ['preview', 'code'];
	let tabButtons = [];
	let tabButton;

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
		savedPreviewComponent = previewContent;
		console.log('savedPreviewComponent', savedPreviewComponent)
	})

	//handle rendering
	let previewContent
	let savedPreviewComponent 

	let isContentUpdated = false;

	const handleOutro = () => {
		if (!isContentUpdated) {
			// savedPreviewComponent = previewContent;
			isContentUpdated = true;
		}
	};

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

	<div class="overflow-hidden grid center">
		{#if activeTab === 'preview'}
		<div
			transition:slide={{
				duration: 300
			}}
			bind:this={previewContent}
			on:outroend={handleOutro}
			class="mt-2 mb-3 overflow-hidden"		>
		{#if !isContentUpdated}
			<slot name="preview" />
		{:else}
			<svelte:component this={savedPreviewComponent} />
		{/if}
		</div>
		{:else}
		<div
			transition:slide={{
				duration: 300
			}}
			class="mt-5 mb-3 overflow-auto md-preview"
		>
			<slot />
		</div>
		{/if}
	</div>
</div>

