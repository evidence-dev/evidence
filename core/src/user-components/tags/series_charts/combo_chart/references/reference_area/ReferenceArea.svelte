<script lang="ts">
	import ReferenceAreaDynamic from './ReferenceAreaDynamic.svelte';
	import ReferenceAreaStatic from './ReferenceAreaStatic.svelte';
	import type { ReferenceAreaProps } from './types';

	const props: ReferenceAreaProps = $props();
	const data = $derived(props.data);
	const x_min = $derived(props.x_min);
	const x_max = $derived(props.x_max);
	const y_min = $derived(props.y_min);
	const y_max = $derived(props.y_max);
</script>

<!-- prettier-ignore -->
{#if
	data &&
	typeof x_min !== 'number' &&
	typeof x_max !== 'number' &&
	typeof y_min !== 'number' &&
	typeof y_max !== 'number'
}
	<ReferenceAreaDynamic {...props} {data} {x_min} {x_max} {y_min} {y_max} />
{:else}
	<ReferenceAreaStatic {...props} />
{/if}
