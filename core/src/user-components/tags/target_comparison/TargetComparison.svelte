<script lang="ts">
	import { useId } from 'bits-ui';
	import { getComparisonSelectorContext } from '../comparison_selector/comparison-selector-context';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import type { TargetComparisonOption } from '../comparison_selector/types';

	const props: UserComponentProps<typeof schema> = $props();

	const name = $derived(props.name);
	const target = $derived(props.target);
	const display_type = $derived(props.display_type as TargetComparisonOption['display_type']);
	const text = $derived(props.text);
	const pct_fmt = $derived(props.pct_fmt);
	const abs_fmt = $derived(props.abs_fmt);
	const down_is_good = $derived(props.down_is_good);

	const context = getComparisonSelectorContext();

	if (!context) {
		throw new Error('target_comparison must be used inside a comparison_selector');
	}

	const { addOption, removeOption } = context;

	const id = useId('target-comparison');
	const option: TargetComparisonOption = $derived({
		id,
		name,
		compare_vs: 'target',
		target,
		display_type,
		text,
		pct_fmt,
		abs_fmt,
		down_is_good
	});

	$effect(() => {
		addOption(option);
		return () => {
			removeOption(option);
		};
	});
</script>
