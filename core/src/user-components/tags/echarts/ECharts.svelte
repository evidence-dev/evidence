<script lang="ts">
	import { echarts } from './echarts.action';
	import { mode } from 'mode-watcher';
	import type { ECharts, EChartsOption } from 'echarts';
	import { cn } from '../../../shadcn/utils';
	import { getPageRenderTrackerContext } from '../../../page-render-tracker.context.svelte';
	import { getPrintModeContext } from '../../../print-mode.context';
	import { createTheme } from './echarts-themes';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { getCardContext } from '../../common/card-context.svelte';
	import DebugConfig from './DebugConfig.svelte';

	type Props = {
		chart?: ECharts;
		options: EChartsOption;
		class?: string;
		style?: string;
		renderer?: 'svg' | 'canvas';
		group?: string;
		onExtraHeightChange?: (extraHeight: number) => void;
	};

	let {
		chart = $bindable(),
		options,
		renderer = 'canvas',
		class: className,
		style: styleProp,
		group,
		onExtraHeightChange
	}: Props = $props();

	const renderTracker = getPageRenderTrackerContext();
	let markRenderComplete: (() => void) | undefined;
	let isReady = $state(false);
	let internalExtraHeight = $state(0);
	const printing = getPrintModeContext();
	const themeContext = getThemeContext();
	const cardContext = getCardContext();

	// Determine if we should use card-derived colors
	// Use card colors when inside a card to ensure proper contrast with card background
	const useCardColors = $derived(Boolean(cardContext?.insideCard));

	// Generate custom light/dark themes from ThemeContext
	// ThemeContext already handles hierarchy resolution (org → project → page)
	// If inside a card, use card-bg-* tokens; otherwise use base-* tokens
	const customLightTheme = $derived.by(() => {
		return createTheme(
			themeContext.themes.light,
			'light',
			useCardColors
		) as unknown as EChartsOption;
	});

	const customDarkTheme = $derived.by(() => {
		return createTheme(themeContext.themes.dark, 'dark', useCardColors) as unknown as EChartsOption;
	});

	// Apply chart colors from resolved theme
	// Priority: component-level options.color > resolved theme palette
	const finalOptions = $derived.by(() => {
		// If user explicitly set colors in options, use those
		if (options.color && Array.isArray(options.color) && options.color.length > 0) {
			return options;
		}

		// Otherwise, use resolved color palette from theme context
		// (ThemeContext already resolved org → project → page hierarchy)
		return {
			...options,
			color: themeContext.activeTheme.colorPalettes.default
		};
	});

	const wrapperStyle = $derived.by(() => {
		const styles = [];
		if (styleProp) styles.push(styleProp);
		if (!onExtraHeightChange && internalExtraHeight > 0) {
			styles.push(`min-height: calc(100% + ${internalExtraHeight}px)`);
		}
		return styles.length > 0 ? styles.join('; ') : undefined;
	});
</script>

<!--
	Rendering the chart with absolute positioning enables it to shrink inside of a flexbox container
	https://github.com/apache/echarts/issues/11791#issuecomment-1476762638
-->
<div
	class={cn(className, 'relative overflow-hidden')}
	style={wrapperStyle}
	data-echarts-ready={isReady}
>
	<div
		class="absolute inset-0 h-full w-full"
		use:echarts={{
			echartsOptions: finalOptions,
			renderer,
			theme: mode.current,
			customLightTheme,
			customDarkTheme,
			printing,
			group,
			animateIntro: themeContext.activeTheme.chart?.animateIntro,
			animateUpdates: themeContext.activeTheme.chart?.animateUpdates,
			onExtraHeightChange: (extraHeight) => {
				if (onExtraHeightChange) {
					onExtraHeightChange(extraHeight);
				} else {
					internalExtraHeight = extraHeight;
				}
			},
			onCreate: (c) => {
				chart = c;
				markRenderComplete = renderTracker?.startTask('echarts');
			},
			onDestroy: () => {
				chart = undefined;
				// If the chart is destroyed before ready, don't block the page
				markRenderComplete?.();
				markRenderComplete = undefined;
				isReady = false;
			},
			onReady: () => {
				markRenderComplete?.();
				markRenderComplete = undefined;
				isReady = true;
			}
		}}
	></div>
</div>

<DebugConfig options={finalOptions} />
