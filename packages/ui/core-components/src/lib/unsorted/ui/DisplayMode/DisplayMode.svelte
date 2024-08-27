<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import DisplayModal from './DisplayModal.svelte';

	let showModal = false;
</script>


<DisplayModal bind:showModal>
	<slot />
</DisplayModal>
<slot />
<button 
class="bg-blue-500 hover:bg-blue-200 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
on:click={() => (showModal = true)}>
Presentation Mode
</button>