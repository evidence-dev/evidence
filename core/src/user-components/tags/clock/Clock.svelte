<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';

	let props: UserComponentProps<typeof schema> = $props();

	let now = $state(new Date());

	$effect(() => {
		const interval = setInterval(() => {
			now = new Date();
		}, 1000);
		return () => clearInterval(interval);
	});

	const time = $derived.by(() => {
		const is24h = props.format === '24h';
		const options: Intl.DateTimeFormatOptions = {
			hour: 'numeric',
			minute: '2-digit',
			second: '2-digit',
			hour12: !is24h
		};
		return now.toLocaleTimeString(undefined, options);
	});

	const date = $derived(
		now.toLocaleDateString(undefined, {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	);

	const alignClass = $derived(props.align === 'right' ? 'items-end text-right' : 'items-start');
	const fontClass = $derived(props.variant === 'mono' ? 'font-mono' : '');
</script>

<div class="flex flex-col gap-0.5 {alignClass} {fontClass}">
	<span class="text-2xl font-semibold tracking-tight tabular-nums">{time}</span>
	<span class="text-muted-foreground text-sm">{date}</span>
</div>
