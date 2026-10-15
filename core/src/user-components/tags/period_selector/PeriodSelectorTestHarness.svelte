<script lang="ts">
	import { untrack, type ComponentProps } from 'svelte';
	import PeriodSelector from './PeriodSelector.svelte';
	import { setPeriodReadonlyContext } from './period-readonly.context';

	let { props, readonly }: { props: ComponentProps<typeof PeriodSelector>; readonly: boolean } =
		$props();
	untrack(() => setPeriodReadonlyContext(readonly));
</script>

<PeriodSelector {...props} />
