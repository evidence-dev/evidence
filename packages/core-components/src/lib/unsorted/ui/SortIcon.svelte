<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronUp, ChevronDown } from '@steeze-ui/tabler-icons';

	export let ascending;
</script>

<span class="inline-flex items-center align-bottom mb-2 ml-1">
	<span class="w-3 h-3 items-center">
		{#if ascending}
			<Icon src={ChevronUp} />
		{:else}
			<Icon src={ChevronDown} />
		{/if}
	</span>
</span>
