<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';

	let props: UserComponentProps<typeof schema> = $props();
	const lines = $derived(props.lines ?? 1);
	const items = $derived(Array.from({ length: lines }));
</script>

{#each items as _}
	<br />
{/each}
