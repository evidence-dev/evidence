<script lang="ts">
	import ReferenceLineDynamic from './ReferenceLineDynamic.svelte';
	import ReferenceLineStatic from './ReferenceLineStatic.svelte';
	import type { ReferenceLineProps } from './types';

	const props: ReferenceLineProps = $props();
	const data = $derived(props.data);
	const x = $derived(props.x);
	const y = $derived(props.y);
	const x1 = $derived(props.x1);
	const y1 = $derived(props.y1);
	const x2 = $derived(props.x2);
	const y2 = $derived(props.y2);
</script>

<!-- prettier-ignore -->
{#if
	data &&
	typeof x !== 'number' &&
	typeof y !== 'number' &&
	typeof x1 !== 'number' &&
	typeof y1 !== 'number' &&
	typeof x2 !== 'number' &&
	typeof y2 !== 'number'
}
	<ReferenceLineDynamic {...props} {data} {x} {y} {x1} {y1} {x2} {y2} />
{:else}
	<ReferenceLineStatic {...props} />
{/if}
