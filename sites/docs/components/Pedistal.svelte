<script>
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	export let transition = slide;
	/** @type {HTMLDivElement} */
	let slotContainer;
	/** @type {HTMLDivElement}*/
	let self;
	/** @type {HTMLDivElement}*/
	let stash;

	//
	export let id = undefined;

	export let visible = false;

	onMount(() => {
		if (visible) {
			self.appendChild(slotContainer);
		}
	});
</script>

{#if visible}
	<div
		class="col-start-1 col-end-2 row-start-1 row-end-2"
		transition:transition={{ duration: 3000 }}
		bind:this={self}
		on:introstart={() => {
			console.log(`Slot Container ${id} -> Pedistal`);
			self.appendChild(slotContainer);
		}}
		on:outrostart={() => {
			console.log(`Slot Container ${id} -> Stash`);
			stash.appendChild(slotContainer);
		}}
	>
		<slot />
		<!-- Empty Div-->
	</div>
{/if}
<div bind:this={stash} class="hidden">
	<!-- Use the contents class to avoid any rendering impact -->
	<div bind:this={slotContainer} class="content" id="1"></div>
</div>
