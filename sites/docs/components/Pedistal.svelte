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

	export let visible = false;

	onMount(() => {
		if (visible) {
			self.appendChild(slotContainer);
		}
	});

	$: console.log(visible);
</script>

{#if visible}
	<div
		transition:transition={{ duration: 300 }}
		bind:this={self}
		on:introstart={() => {
			console.log('Slot Container -> Pedistal');
			self.appendChild(slotContainer);
		}}
		on:outroend={() => {
			console.log('Slot Container -> Stash');
			stash.appendChild(slotContainer);
		}}
	>
		<!-- Empty Div-->
	</div>
{/if}

<div bind:this={stash} class="hidden">
	<!-- Use the contents class to avoid any rendering impact -->
	<div bind:this={slotContainer} class="contents" id="1">
		<slot />
	</div>
</div>
