<script lang="ts">
	import ReferencePointDynamic from './ReferencePointDynamic.svelte';
	import ReferencePointStatic from './ReferencePointStatic.svelte';
	import type { ReferencePointProps } from './types';

	const props: ReferencePointProps = $props();
	const data = $derived(props.data);
	const x = $derived(props.x);
	const y = $derived(props.y);
</script>

<!-- prettier-ignore -->
{#if
	data &&
	typeof x !== 'number' &&
	typeof y !== 'number'
}
	<ReferencePointDynamic {...props} {data} {x} {y} />
{:else}
	<ReferencePointStatic {...props} />
{/if}
