<script lang="ts">
	import type { Component } from 'svelte';
	import { setComponentWrapperContext } from '../common/component-wrapper-context';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let { component: Input, props }: { component: Component<any>; props: Record<string, unknown> } =
		$props();

	setComponentWrapperContext({
		getComponentId: () => 'input-under-test',
		setError: () => {},
		hasBlockingErrors: () => false
	});
</script>

<Input {...props} />
