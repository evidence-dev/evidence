<script>
	// import { cubicInOut } from 'svelte/easing';
	// import { crossfade } from 'svelte/transition';
	import { fmt as format } from '@evidence-dev/component-utilities/formatting';

	export let metric;
	export let data;
	export let fmt = 'num0';

	let latest = null;
	let change = null;
	let changePercent = null;
	let metricFmt = metric.fmt || fmt;

	$: if (data.length > 0) {
		latest = format(displayLatest(metric.label), metricFmt);
		change = format(displayChange(metric.label), 'num0');
		changePercent = format(displayChangePercent(metric.label), 'pct');
	}

	const displayLatest = (metric) => {
		if (data.length > 0) {
			return data[data.length - 1][metric];
		}
		return 0;
	};

	const displayChange = (metric) => {
		if (data.length > 1) {
			return data[data.length - 1][metric] - data[0][metric];
		}
		return 0;
	};

	const displayChangePercent = (metric) => {
		if (data.length > 1) {
			return (data[data.length - 1][metric] - data[0][metric]) / data[0][metric];
		}
		return 0;
	};

	// const [send, receive] = crossfade({
	// 	duration: 200,
	// 	easing: cubicInOut
	// });
</script>

<div
	class="truncate text-left shrink col-span-3 font-medium relative z-10 group-data-[state=checked]:text-base-content group-data-[state=checked]:font-bold transition duration-200"
>
	{metric.label}
</div>
<div
	class="text-right font-medium relative z-10 group-data-[state=checked]:text-base-content transition duration-200"
>
	{latest}
</div>
<div class="{change < 0 ? 'text-negative' : 'text-positive'} text-right relative z-10">
	{change < 0 ? '' : '+'}{change}
</div>
<div
	class="text-right relative z-10 border rounded {change < 0
		? 'bg-negative/20 border-negative/40 text-negative'
		: 'bg-positive/15 border-positive/40 text-positive'}"
>
	<span class="px-2">
		{change < 0 ? '' : '+'}{changePercent}
	</span>
</div>
<!-- {#if selectedMetric == metric.label}
	<div
		in:send={{ key: 'trigger' }}
		out:receive={{ key: 'trigger' }}
		class="absolute top-0 h-full w-full rounded-md bg-white border z-0"
	/>
{/if} -->
