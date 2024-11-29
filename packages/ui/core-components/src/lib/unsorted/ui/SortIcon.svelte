<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronUp, ChevronDown } from '@steeze-ui/tabler-icons';

	export let ascending;
</script>

{#if ascending}
	<Icon src={ChevronUp} class="w-[10px] h-[10px] mb-0.5 inline" />
{:else}
	<Icon src={ChevronDown} class="w-[10px] h-[10px] mb-0.5 inline" />
{/if}
