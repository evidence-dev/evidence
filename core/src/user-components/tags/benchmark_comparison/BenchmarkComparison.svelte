<script lang="ts">
	import { useId } from 'bits-ui';
	import { getComparisonSelectorContext } from '../comparison_selector/comparison-selector-context';
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import type { BenchmarkComparisonOption } from '../comparison_selector/types';

	const props: UserComponentProps<typeof schema> = $props();

	const name = $derived(props.name);
	const agg = $derived(props.agg as BenchmarkComparisonOption['agg']);
	const subject = $derived(props.subject);
	const value = $derived(props.value);
	const where = $derived(props.where);
	const within = $derived(props.within as string[] | undefined);
	const exclude_self = $derived(props.exclude_self ?? false);
	const display_type = $derived(props.display_type as BenchmarkComparisonOption['display_type']);
	const text = $derived(props.text);
	const pct_fmt = $derived(props.pct_fmt);
	const abs_fmt = $derived(props.abs_fmt);
	const down_is_good = $derived(props.down_is_good ?? false);

	const context = getComparisonSelectorContext();

	if (!context) {
		throw new Error('benchmark_comparison must be used inside a comparison_selector');
	}

	const { addOption, removeOption } = context;

	const id = useId('benchmark-comparison');
	const option: BenchmarkComparisonOption = $derived({
		id,
		name,
		compare_vs: 'benchmark',
		agg,
		subject,
		value,
		where,
		within,
		exclude_self,
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
