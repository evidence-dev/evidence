<script>
	import { onMount } from 'svelte';
	// import Pedistal from './Pedistal.svelte';

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

	<!-- <div>
		<Pedistal visible={activeTab === 'preview'}>
			<slot name="preview" />
		</Pedistal>
		<Pedistal visible={activeTab === 'code'}>
			<slot  />
		</Pedistal>
	</div> -->

	<div class="overflow-hidden grid">
		<div
			class="mt-2 mb-3 overflow-hidden col-start-1 col-end-2 row-start-1 row-end-2 transition-[max-height] ease-in-out duration-3000"
			class:invisible={activeTab !== 'preview'}
			class:slide-in={activeTab === 'preview'}
			class:slide-out={activeTab !== 'preview'}
		>
			<slot name="preview" />
		</div>
		<div
			class="mb-3 overflow-auto md-preview col-start-1 col-end-2 row-start-1 row-end-2 transition-[max-height] ease-in-out duration-3000"
			class:invisible={activeTab !== 'code'}
			class:slide-in={activeTab === 'code'}
			class:slide-out={activeTab !== 'code'}
		>
			<slot />
		</div>
	</div>
</div>

<style>
	.slide-out {
		opacity: 0;
		height: 0;
		overflow: hidden;
		transform: translateY(-70%);
		transition:
			opacity 0.3s ease,
			transform 0.3s ease;
	}

	.slide-in {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.3s ease,
			transform 0.3s ease; /* 0.2s delay for transform */
	}
</style>
