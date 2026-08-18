<script lang="ts">
	import type { UserComponentProps } from '../../../types';
	import type { schema } from './schema';
	import type { SeriesInternalProps } from '../combo_chart/series/Series.svelte';
	import { getStackedYMinMax } from '../../../getStackedYMinMax';
	import Series from '../combo_chart/series/Series.svelte';
	import merge from 'lodash/merge';
	import type { LineSeriesOption } from 'echarts';
	import { graphic } from 'echarts';
	import { browser } from '$app/environment';
	import { getThemeContext } from '../../../../theme/theme.context.svelte';

	type InternalProps = {
		stacked?: boolean | string; // Can be overridden by area_chart (validated to true/false/"100%" by schema)
		yLabel?: string; // Metric-mode legend label override; forwarded to <Series>.
	};

	const props: UserComponentProps<typeof schema> & InternalProps = $props();
	const themeContext = getThemeContext();
	const step = $derived(props.options?.step);
	const stack_id = $derived(props.stack_id);
	const gradient = $derived(
		props.options?.gradient ?? themeContext.activeTheme.chart?.areaGradient ?? false
	);

	// Check if we're in percentage stacking mode
	const isPercentageStack = $derived(props.stacked === '100%');

	// Determine the stack identifier:
	// 1. If stack_id prop is provided, use it
	// 2. If stacked prop is true or "100%" (from schema default or area_chart override), use default 'stack1'
	// 3. Otherwise, no stacking
	const stackIdentifier = $derived(stack_id ?? (props.stacked ? 'stack1' : undefined));
	const smooth = $derived(props.options?.smooth);

	/**
	 * Converts any CSS color (hex, rgb, rgba, named colors) to RGB components.
	 * Uses canvas for named color conversion when in browser.
	 */
	function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
		// Handle hex colors (#RGB, #RRGGBB, #RRGGBBAA)
		const hexMatch = color.match(/^#([0-9A-Fa-f]{3,8})$/);
		if (hexMatch) {
			const hex = hexMatch[1];
			if (hex.length === 3) {
				return {
					r: parseInt(hex[0] + hex[0], 16),
					g: parseInt(hex[1] + hex[1], 16),
					b: parseInt(hex[2] + hex[2], 16),
					a: 1
				};
			} else if (hex.length === 6) {
				return {
					r: parseInt(hex.slice(0, 2), 16),
					g: parseInt(hex.slice(2, 4), 16),
					b: parseInt(hex.slice(4, 6), 16),
					a: 1
				};
			} else if (hex.length === 8) {
				return {
					r: parseInt(hex.slice(0, 2), 16),
					g: parseInt(hex.slice(2, 4), 16),
					b: parseInt(hex.slice(4, 6), 16),
					a: parseInt(hex.slice(6, 8), 16) / 255
				};
			}
		}

		// Handle rgb(r, g, b) and rgba(r, g, b, a)
		const rgbMatch = color.match(
			/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i
		);
		if (rgbMatch) {
			return {
				r: parseInt(rgbMatch[1], 10),
				g: parseInt(rgbMatch[2], 10),
				b: parseInt(rgbMatch[3], 10),
				a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
			};
		}

		// For CSS named colors (e.g., "red", "blue"), use canvas to convert
		if (browser) {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = 1;
				canvas.height = 1;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.fillStyle = color;
					const computedColor = ctx.fillStyle;
					// Canvas returns hex for named colors
					if (computedColor.startsWith('#')) {
						return parseColor(computedColor);
					}
				}
			} catch {
				// Canvas conversion failed, return null
			}
		}

		return null;
	}

	/**
	 * Creates a linear gradient from the series color (with opacity) at the top
	 * to transparent at the bottom.
	 *
	 * Supports:
	 * - Hex colors: #RGB, #RRGGBB, #RRGGBBAA
	 * - RGB/RGBA: rgb(r, g, b), rgba(r, g, b, a)
	 * - CSS named colors: red, blue, green, etc. (uses canvas to convert)
	 */
	function createGradientAreaStyle(seriesColor: string | undefined) {
		// Default to first color from default palette if no series color
		const baseColor = seriesColor || '#154886';
		const parsed = parseColor(baseColor);

		if (parsed) {
			const { r, g, b } = parsed;
			return {
				color: new graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: `rgba(${r}, ${g}, ${b}, 0.35)` },
					{ offset: 1, color: `rgba(${r}, ${g}, ${b}, 0)` }
				])
			};
		}

		// Fallback: if we can't parse the color (shouldn't happen with canvas conversion),
		// use a default blue gradient — kept in sync with the palette lead in
		// `default-theme.ts` (#154886 → rgb(21, 72, 134)).
		return {
			color: new graphic.LinearGradient(0, 0, 0, 1, [
				{ offset: 0, color: 'rgba(21, 72, 134, 0.35)' },
				{ offset: 1, color: 'rgba(21, 72, 134, 0)' }
			])
		};
	}

	const transformSeriesOptions: SeriesInternalProps['transformSeriesOptions'] = $derived(
		(options) => {
			// Non-gradient fills use ECharts' ~0.7 default alpha (matches prod);
			// gradient path builds its own linearGradient stops in
			// `createGradientAreaStyle` above.
			const areaStyle = gradient
				? createGradientAreaStyle(options.color as string | undefined)
				: {};

			merge(options, <LineSeriesOption>{
				step,
				smooth,
				areaStyle,
				stack: stackIdentifier
			});
			if (props.echarts_options) merge(options, props.echarts_options);
		}
	);

	// For percentage stacking, y-axis should be fixed at 0-1 (SSF % format displays as 0%-100%)
	// For regular stacking, use getStackedYMinMax to calculate proper bounds
	// For no stacking, let the default behavior handle it
	const getYMinMax: SeriesInternalProps['getYMinMax'] = $derived(
		isPercentageStack ? () => ({ min: 0, max: 1 }) : stackIdentifier ? getStackedYMinMax : undefined
	);
</script>

<Series
	{...props}
	type="line"
	{getYMinMax}
	{transformSeriesOptions}
	percentageStack={isPercentageStack}
	isStacked={!!stackIdentifier}
/>
