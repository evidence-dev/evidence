<script lang="ts">
	import { formatValue } from '../../formatValue';
	import { setupRenderReadiness } from '../../../readiness.svelte';

	interface Props {
		value: unknown;
		fmt?: string;
		text?: string;
		chip?: boolean;
		downIsGood?: boolean;
		showValue?: boolean;
		showSymbol?: boolean;
		symbolPosition?: 'left' | 'right';
		neutralRange?: (number | null)[];
		className?: string;
	}

	const props: Props = $props();

	const value = $derived(props.value);
	const className = $derived(props.className);
	const fmt = $derived(props.fmt);
	const text = $derived(props.text);
	const chip = $derived(props.chip ?? false);
	const downIsGood = $derived(props.downIsGood ?? false);
	const showValue = $derived(props.showValue ?? true);
	const showSymbol = $derived(props.showSymbol ?? true);
	const symbolPosition = $derived(props.symbolPosition ?? 'right');
	const neutralRange = $derived(props.neutralRange ?? [0, 0]);
	const neutralMin = $derived(neutralRange[0] ?? -Infinity);
	const neutralMax = $derived(neutralRange[1] ?? Infinity);

	const hasValidValue = $derived(value !== null && value !== undefined);
	// Minimal readiness: purely presentational, ready immediately when it has a value
	setupRenderReadiness('delta', () => hasValidValue);

	// Format the value
	const formattedValue = $derived(hasValidValue ? formatValue(value, fmt, String(value)) : '–');

	// Determine value status (positive, negative, or neutral)
	function getValueStatus(val: unknown): 'positive' | 'negative' | 'neutral' {
		if (val === null || val === undefined) return 'neutral';
		if (typeof val === 'number') {
			return val > neutralMax ? 'positive' : val < neutralMin ? 'negative' : 'neutral';
		}
		return 'neutral';
	}

	const valueStatus = $derived(getValueStatus(value));

	// Style classes; up/down colors come from the theme tokens
	const up = 'text-(--theme-positive)';
	const down = 'text-(--theme-negative)';
	const upChip = 'bg-(--theme-positive)/10 border border-(--theme-positive)/25';
	const downChip = 'bg-(--theme-negative)/10 border border-(--theme-negative)/25';

	const textStyles = $derived({
		positive: downIsGood ? down : up,
		negative: downIsGood ? up : down,
		neutral: 'text-gray-500'
	});

	const chipStyles = $derived({
		positive: downIsGood ? downChip : upChip,
		negative: downIsGood ? upChip : downChip,
		neutral: 'bg-gray-100 border border-gray-200'
	});

	const fontClass = $derived(chip ? 'text-sm' : 'text-base');
</script>

<span
	class="{className} {fontClass} inline {textStyles[valueStatus]} {chip
		? chipStyles[valueStatus]
		: ''} {chip ? 'rounded-md px-1' : ''} inline-flex items-center align-baseline"
>
	<span class="inline-flex items-center">
		{#if symbolPosition === 'right'}
			{#if showValue}
				<span>{hasValidValue ? formattedValue : '–'}</span>
			{/if}
			{#if showSymbol}
				<span class="ml-0.5 inline-flex items-center justify-center">
					{#if valueStatus === 'positive'}
						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block align-baseline"
						>
							<path
								d="M6 2C6.3 2 6.6 2.1 6.8 2.4L10.8 8.4C11.1 8.8 11 9.4 10.6 9.7C10.4 9.9 10.2 10 10 10H2C1.4 10 1 9.6 1 9C1 8.8 1.1 8.6 1.2 8.4L5.2 2.4C5.4 2.1 5.7 2 6 2Z"
								fill="currentColor"
							/>
						</svg>
					{:else if valueStatus === 'negative'}
						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block align-baseline"
						>
							<path
								d="M6 10C5.7 10 5.4 9.9 5.2 9.6L1.2 3.6C0.9 3.2 1 2.6 1.4 2.3C1.6 2.1 1.8 2 2 2H10C10.6 2 11 2.4 11 3C11 3.2 10.9 3.4 10.8 3.6L6.8 9.6C6.6 9.9 6.3 10 6 10Z"
								fill="currentColor"
							/>
						</svg>
					{:else}
						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block align-baseline"
						>
							<rect x="2" y="4.25" width="8" height="3.5" rx="0.75" fill="currentColor" />
						</svg>
					{/if}
				</span>
			{/if}
		{:else}
			{#if showSymbol}
				<span class="mr-0.5 inline-flex items-center justify-center">
					{#if valueStatus === 'positive'}
						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block align-baseline"
						>
							<path
								d="M6 2C6.3 2 6.6 2.1 6.8 2.4L10.8 8.4C11.1 8.8 11 9.4 10.6 9.7C10.4 9.9 10.2 10 10 10H2C1.4 10 1 9.6 1 9C1 8.8 1.1 8.6 1.2 8.4L5.2 2.4C5.4 2.1 5.7 2 6 2Z"
								fill="currentColor"
							/>
						</svg>
					{:else if valueStatus === 'negative'}
						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block align-baseline"
						>
							<path
								d="M6 10C5.7 10 5.4 9.9 5.2 9.6L1.2 3.6C0.9 3.2 1 2.6 1.4 2.3C1.6 2.1 1.8 2 2 2H10C10.6 2 11 2.4 11 3C11 3.2 10.9 3.4 10.8 3.6L6.8 9.6C6.6 9.9 6.3 10 6 10Z"
								fill="currentColor"
							/>
						</svg>
					{:else}
						<svg
							width="10"
							height="10"
							viewBox="0 0 12 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							class="inline-block align-baseline"
						>
							<rect x="2" y="4.25" width="8" height="3.5" rx="0.75" fill="currentColor" />
						</svg>
					{/if}
				</span>
			{/if}
			{#if showValue}
				<span>{hasValidValue ? formattedValue : '–'}</span>
			{/if}
		{/if}
		{#if text}
			<span class="ml-1 inline-flex items-center">{text}</span>
		{/if}
	</span>
</span>
