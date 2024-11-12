<script>
	import { cubicInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	let activeTab = 'preview';

	const tabs = ['preview', 'code'];
	let tabButtons = [];

	function setTab(tab, index) {
		activeTab = tab;
		updateActiveBorder(index);
	}

	const [send, receive] = crossfade({
		duration: 200,
		easing: cubicInOut
	});
</script>

<div class="doc-tab mt-2">
	<div class="flex justify-end">
		{#each tabs as tab, index}
			<button
				class="relative p-1 transition-colors duration-300 text-sm font-medium ease-in-out capitalize tracking-wide focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 rounded-md hover:text-gray-950 {activeTab ===
				tab
					? 'text-gray-950'
					: 'text-gray-500'}"
				on:click={() => setTab(tab, index)}
				bind:this={tabButtons[index]}
			>
				{tab}
				{#if activeTab === tab}
					<div
						class="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-gray-950"
						in:send={{ key: 'trigger' }}
						out:receive={{ key: 'trigger' }}
					/>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Preview and code tabs -->
	<div>
		<div
			class={activeTab !== 'preview' ? 'h-[0px]' : 'mb-3 mt-2'}
			class:invisible={activeTab !== 'preview'}
		>
			<slot name="preview" />
		</div>
		<div
			class="overflow-auto md-preview {activeTab !== 'code' ? 'h-[0px]' : 'mt-2'}"
			class:invisible={activeTab !== 'code'}
		>
			<slot />
		</div>
	</div>
</div>

<style>
	/* Styles codeblocks inside doctabs */
	:global(.md-preview > div:first-of-type) {
		margin: 0;
	}
</style>
