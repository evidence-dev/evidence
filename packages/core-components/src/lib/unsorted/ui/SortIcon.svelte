<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronUp, ChevronDown } from '@steeze-ui/tabler-icons';

	export let ascending;
</script>

{#if ascending}
	<Icon src={ChevronUp} class="w-3 h-3 inline mb-0.5" />
{:else}
	<Icon src={ChevronDown} class="w-3 h-3 inline mb-0.5" />
{/if}
