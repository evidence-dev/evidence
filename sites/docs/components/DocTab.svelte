<script>
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

	<div class="overflow-hidden grid center" bind:this={tabContent}>
		<div
			class:slide-out={activeTab === 'code'}
			class:slide-in={activeTab === 'preview'}
			class="mt-2 mb-3 overflow-hidden"
		>
			<slot name="preview" />
		</div>
		<div
			class:slide-out={activeTab === 'preview'}
			class:slide-in={activeTab === 'code'}
			class="mt-5 mb-3 overflow-auto md-preview"
		>
			<slot />
		</div>
	</div>
</div>

<style>
	.md-preview :global(*) {
		margin: 0px;
	}

	.slide-in {
		transform: translateY(0);
		opacity: 1;
		transition:
			transform 0.3s ease,
			opacity 0.2s ease;
	}

	.slide-out {
		transform: translateY(-30%);
		position: absolute;
		opacity: 0;
		visibility: hidden;
		transition:
			transform 0.3s ease,
			opacity 0.2s ease;
	}
</style>
