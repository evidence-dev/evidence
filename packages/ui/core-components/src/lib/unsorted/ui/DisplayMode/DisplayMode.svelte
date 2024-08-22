<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import DisplayModal from './DisplayModal.svelte';

	let showModal = false;
</script>

<button on:click={() => (showModal = true)}> Presentation Mode </button>

<DisplayModal bind:showModal>
	<slot />
</DisplayModal>
<slot />