import { registerTheme, init, connect, type EChartsOption, type ECharts } from 'echarts';
import { echartsDarkTheme, echartsLightTheme } from './echarts-themes';
import type { RendererType } from 'echarts/types/src/util/types.js';
import type { Action } from 'svelte/action';
import { withAutoTimeAxisLabelThinning, withAutoXAxisLabelLayout } from './echarts-utils';
import { logger } from '../../../shims/logger';
import isEqual from 'lodash/isEqual';

interface Options {
	echartsOptions: EChartsOption;
	renderer: RendererType;
	theme?: 'light' | 'dark';
	onCreate?: (chart: ECharts) => void;
	onDestroy?: () => void;
	onReady?: () => void;
	onExtraHeightChange?: (extraHeight: number) => void;
	printing?: boolean;
	// id linking this chart to others via echarts.connect (synced tooltip/zoom).
	group?: string;
	// Optional: User-configured themes to replace default light/dark
	customLightTheme?: EChartsOption;
	customDarkTheme?: EChartsOption;
	// Chart animation theme tokens. Charts hardcode option-level animationDuration
	// (e.g. 800), which wins over the registered theme — so the toggles are honored
	// here when false. Undefined = leave the chart's own values (default behavior).
	animateIntro?: boolean;
	animateUpdates?: boolean;
}

/** Check if ECharts options contain actual series data */
function hasSeriesData(opts: EChartsOption): boolean {
	const series = opts.series;
	if (!series) return false;
	if (Array.isArray(series)) {
		// Check if any series has data
		return series.some((s) => {
			const data = (s as { data?: unknown[] }).data;
			return Boolean(data && Array.isArray(data) && data.length > 0);
		});
	}
	// Single series object
	const data = (series as { data?: unknown[] }).data;
	return Boolean(data && Array.isArray(data) && data.length > 0);
}

export const echarts: Action<HTMLDivElement, Options> = (node, options) => {
	// Register themes - custom themes are always provided from ThemeContext
	registerTheme('light', options.customLightTheme || echartsLightTheme);
	registerTheme('dark', options.customDarkTheme || echartsDarkTheme);

	const chart = createChart(node, options);
	const initialHasData = hasSeriesData(options.echartsOptions);

	options.onCreate?.(chart);

	applyConnectGroup(chart, options.group);

	// Signal readiness once we have a stable render WITH DATA
	let readyFired = false;
	let readyScheduled = false;
	let hasReceivedData = initialHasData;

	const fireReadyOnce = () => {
		if (readyFired) return;
		readyFired = true;
		options.onReady?.();
	};

	const scheduleReadyCheck = () => {
		if (readyScheduled) return;
		if (options.printing) {
			// In print mode, don't signal ready until we have data
			if (!hasReceivedData) {
				return;
			}
		}

		readyScheduled = true;

		if (options.printing) {
			// PDF mode: Full expensive readiness check for pixel-perfect rendering
			(async () => {
				try {
					logger.debug('[echarts action] scheduleReadyCheck: start');
				} catch (_e) {
					/* noop */
				}
				await waitForFonts();
				try {
					logger.debug('[echarts action] fonts ready');
				} catch (_e) {
					/* noop */
				}
				await waitForStableFrames(node, chart);
				try {
					logger.debug('[echarts action] stable frames detected');
				} catch (_e) {
					/* noop */
				}
				fireReadyOnce();
			})();
		} else {
			// Normal UI: Chart events already indicate rendering is complete
			fireReadyOnce();
		}
	};

	const finishedListener = () => {
		if (options.printing) {
			try {
				logger.debug('[echarts action] finished');
			} catch (_e) {
				/* noop */
			}
		}
		scheduleReadyCheck();
	};
	const renderedListener = () => {
		if (options.printing) {
			try {
				logger.debug('[echarts action] rendered');
			} catch (_e) {
				/* noop */
			}
		}
		scheduleReadyCheck();
	};

	chart.on('finished', finishedListener);
	chart.on('rendered', renderedListener);

	// Apply initial options AFTER listeners so we don't miss first render events
	const initialOptions = getOptionsForEnvironment(
		options.echartsOptions,
		options.printing,
		options.animateIntro,
		options.animateUpdates
	);
	let appliedOptions = initialOptions;
	let extraHeight = 0;
	const getLaidOutOptions = () => {
		const categoryLayout = withAutoXAxisLabelLayout(appliedOptions, node, extraHeight);
		// Sibling for the time-axis + customValues case. Runs on every layout
		// pass so narrowing thins and widening restores. Only the category
		// layout (rotated labels) can request extra bottom-gutter height;
		// time-axis thinning never changes the chart's vertical footprint.
		const timeLayout = withAutoTimeAxisLabelThinning(categoryLayout.options, node);
		if (categoryLayout.extraHeight !== extraHeight) {
			extraHeight = categoryLayout.extraHeight;
			options.onExtraHeightChange?.(extraHeight);
		}
		return timeLayout.options;
	};
	chart.setOption(getLaidOutOptions());

	// Ensure we don't wait forever if events don't fire
	// Kick off a readiness check even if events don't fire
	scheduleReadyCheck();

	// Hide tooltips on right click
	const handleContextMenu = () => {
		if (chart && !chart.isDisposed() && typeof chart.dispatchAction === 'function') {
			try {
				chart.dispatchAction({
					type: 'hideTip'
				});
			} catch (_e) {
				// do nothing
			}
		}
	};
	node.addEventListener('contextmenu', handleContextMenu);

	// Hide tooltips on long press
	const handleLongPress = (event: Event) => {
		if (event instanceof CustomEvent && event.detail?.action === 'contextmenu') {
			handleContextMenu();
		}
	};
	node.addEventListener('longpress', handleLongPress);

	// On touch devices, dismiss the tooltip when a scrolling gesture starts or
	// the user taps outside; captured scroll events can race with the tap that opens it.
	const isCoarsePointer =
		typeof window !== 'undefined' &&
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(pointer: coarse)').matches;

	const handleTouchOutside = (event: Event) => {
		const target = event.target as Node | null;
		if (target && node.contains(target)) return;
		handleContextMenu();
	};

	if (isCoarsePointer) {
		document.addEventListener('touchstart', handleTouchOutside, true);
		document.addEventListener('touchmove', handleContextMenu, { passive: true });
	}

	let copyImg: HTMLImageElement | null = null;
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	const handleBeforeCopy = () => {
		if (chart.isDisposed()) return;

		// Check if this node is in the current selection
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;

		const range = selection.getRangeAt(0);
		if (!range.intersectsNode(node)) return;

		try {
			// Convert chart to image
			const dataUrl = chart.getDataURL({
				type: 'png',
				pixelRatio: 2,
				backgroundColor: '#fff'
			});

			// Create image element
			copyImg = document.createElement('img');
			copyImg.src = dataUrl;
			copyImg.style.cssText = `
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				object-fit: contain;
				user-select: all;
				-webkit-user-select: all;
				-moz-user-select: all;
				-ms-user-select: all;
				z-index: 999999;
			`;

			const chartCanvas = node.querySelector('canvas, svg');
			if (chartCanvas) {
				(chartCanvas as HTMLElement).style.visibility = 'hidden';
			}

			node.appendChild(copyImg);
		} catch (error) {
			logger.error(error, '[echarts action] Error preparing chart for copy');
		}
	};

	const handleAfterCopy = () => {
		if (copyTimeout) {
			clearTimeout(copyTimeout);
		}

		copyTimeout = setTimeout(() => {
			if (copyImg && node.contains(copyImg)) {
				node.removeChild(copyImg);
				copyImg = null;
			}

			const chartCanvas = node.querySelector('canvas, svg');
			if (chartCanvas) {
				(chartCanvas as HTMLElement).style.visibility = 'visible';
			}
		}, 100);
	};

	document.addEventListener('beforecopy', handleBeforeCopy, true);
	document.addEventListener('copy', handleAfterCopy);

	const resizeObserver = new ResizeObserver(() => {
		if (chart.isDisposed()) return;
		chart.resize({
			width: node.clientWidth,
			height: node.clientHeight
		});
		chart.setOption(getLaidOutOptions(), { notMerge: true });
	});
	resizeObserver.observe(node);

	return {
		update: (newOptions) => {
			const doUpdate = () => {
				// Updates are deferred via requestIdleCallback, so this can fire
				// after the component unmounted and `destroy` disposed the chart.
				// Bail before touching options: the layout helpers below invoke
				// axisLabel formatter closures that read Svelte deriveds owned by
				// the destroyed component (derived_inert warnings), and setOption
				// on a disposed chart warns too.
				if (chart.isDisposed()) return;

				// Check if theme configs actually changed (deep comparison)
				const themesChanged =
					!isEqual(newOptions.customLightTheme, options.customLightTheme) ||
					!isEqual(newOptions.customDarkTheme, options.customDarkTheme);

				// Only re-register themes if they actually changed
				if (themesChanged) {
					registerTheme('light', newOptions.customLightTheme || echartsLightTheme);
					registerTheme('dark', newOptions.customDarkTheme || echartsDarkTheme);
				}

				const opts = getOptionsForEnvironment(
					newOptions.echartsOptions,
					newOptions.printing ?? options.printing,
					newOptions.animateIntro ?? options.animateIntro,
					newOptions.animateUpdates ?? options.animateUpdates
				);
				appliedOptions = opts;
				chart.setOption(getLaidOutOptions(), { notMerge: true });

				// Re-apply theme if mode or theme config changed
				if (newOptions.theme !== options.theme || themesChanged) {
					chart.setTheme(newOptions.theme || 'light');
				}

				if (newOptions.group !== options.group) {
					applyConnectGroup(chart, newOptions.group);
				}

				// In print mode, check if data has arrived and trigger ready check
				if (newOptions.printing && !hasReceivedData) {
					const nowHasData = hasSeriesData(newOptions.echartsOptions);
					if (nowHasData) {
						hasReceivedData = true;
						// Reset readyScheduled so we can schedule the check now
						readyScheduled = false;
						scheduleReadyCheck();
					}
				}
				options = newOptions;
			};

			// In print mode, apply updates synchronously to avoid unpredictable
			// requestIdleCallback scheduling in headless Chromium
			if (options.printing) {
				doUpdate();
			} else if ('requestIdleCallback' in window) {
				requestIdleCallback(doUpdate);
			} else {
				doUpdate();
			}
		},
		destroy: () => {
			options.onExtraHeightChange?.(0);
			chart.dispose();
			resizeObserver.disconnect();
			node.removeEventListener('contextmenu', handleContextMenu);
			node.removeEventListener('longpress', handleLongPress);
			if (isCoarsePointer) {
				document.removeEventListener('touchstart', handleTouchOutside, true);
				document.removeEventListener('touchmove', handleContextMenu);
			}
			document.removeEventListener('beforecopy', handleBeforeCopy, true);
			document.removeEventListener('copy', handleAfterCopy);
			if (copyTimeout) {
				clearTimeout(copyTimeout);
			}
			try {
				chart.off('finished', finishedListener);
				chart.off('rendered', renderedListener);
			} catch (_e) {
				// no-op
			}
			options.onDestroy?.();
		}
	};
};

// TODO support seriesColors? https://github.com/evidence-dev/evidence/blob/be0de930390dbc1bfdde0c9c2694af2a34b513d1/packages/lib/component-utilities/src/echarts.js#L55

// TODO support seriesOptions? https://github.com/evidence-dev/evidence/blob/be0de930390dbc1bfdde0c9c2694af2a34b513d1/packages/lib/component-utilities/src/echarts.js#L87

const createChart = (node: HTMLDivElement, options: Options): ECharts => {
	const chart = init(node, options.theme, {
		renderer: options.printing ? 'svg' : options.renderer || 'canvas'
	});

	return chart;
};

// echarts reads `.group` live at event time, so set/clear it and (re)connect;
// disposed charts drop out on their own, so no per-chart disconnect is needed.
export const applyConnectGroup = (chart: ECharts, group: string | undefined): void => {
	chart.group = group ?? '';
	if (group) connect(group);
};

export function getOptionsForEnvironment(
	options: EChartsOption,
	printing?: boolean,
	animateIntro?: boolean,
	animateUpdates?: boolean
): EChartsOption {
	if (!printing) {
		// Honor the chart-animation theme tokens. Charts hardcode option-level
		// animationDuration (e.g. 800), which wins over the registered theme — so
		// zero the relevant durations here when a toggle is off. Undefined leaves
		// the chart's own values untouched (default behavior).
		const introOff = animateIntro === false;
		const updatesOff = animateUpdates === false;
		// Shallow-copy so we never mutate the caller's options object. ECharts is
		// left on its default local-time clock (we no longer pin useUTC): it
		// parses the raw date strings in series.data on the local clock, and our
		// tick math + label formatters (format-time-axis-label.ts) do the same.
		// One clock end-to-end means a zoneless calendar date renders verbatim
		// for every viewer — see X_AXIS_SPEC.md § timezone rules.
		const opts: EChartsOption & { series?: unknown } = { ...options };
		if (!introOff && !updatesOff) return opts;

		if (introOff) {
			(opts as { animationDuration?: number }).animationDuration = 0;
			(opts as { animationDelay?: number }).animationDelay = 0;
		}
		if (updatesOff) {
			(opts as { animationDurationUpdate?: number }).animationDurationUpdate = 0;
			(opts as { animationDelayUpdate?: number }).animationDelayUpdate = 0;
		}
		const themedSeries = (opts as { series?: Array<Record<string, unknown>> }).series;
		if (Array.isArray(themedSeries)) {
			(opts as { series?: Array<Record<string, unknown>> }).series = themedSeries.map((s) => {
				const updated = { ...s };
				if (introOff) {
					updated.animationDuration = 0;
					updated.animationDelay = 0;
				}
				if (updatesOff) {
					updated.animationDurationUpdate = 0;
					updated.animationDelayUpdate = 0;
				}
				return updated;
			});
		}
		return opts;
	}

	// Disable animations entirely when in print mode for deterministic rendering.
	// Shallow-copy so we never mutate the caller's options object.
	const opts: EChartsOption & { series?: unknown } = { ...options };
	(opts as unknown as { animation?: boolean }).animation = false;
	(opts as unknown as { animationDuration?: number }).animationDuration = 0;
	(opts as unknown as { animationDurationUpdate?: number }).animationDurationUpdate = 0;
	(opts as unknown as { animationEasing?: string }).animationEasing = 'linear';
	(opts as unknown as { animationEasingUpdate?: string }).animationEasingUpdate = 'linear';

	const anySeries = (opts as { series?: Array<Record<string, unknown>> }).series;
	if (Array.isArray(anySeries)) {
		(opts as { series?: Array<Record<string, unknown>> }).series = anySeries.map((s) => {
			// Preserve all properties including functions like symbolSize
			const updated = { ...s };
			updated.animation = false;
			updated.animationDuration = 0;
			updated.animationDurationUpdate = 0;
			updated.animationEasing = 'linear';
			updated.animationEasingUpdate = 'linear';
			return updated;
		});
	}

	return opts;
}

async function waitForFonts(): Promise<void> {
	const docFonts = (document as unknown as { fonts?: { ready?: Promise<void> } }).fonts;
	if (docFonts?.ready && typeof docFonts.ready.then === 'function') {
		try {
			await docFonts.ready;
		} catch (_e) {
			// ignore
		}
	}
}

async function waitForStableFrames(node: HTMLDivElement, chart: ECharts): Promise<void> {
	return new Promise((resolve) => {
		let last: [number, number, number, number] | undefined;
		let prev: [number, number, number, number] | undefined;
		let frameCount = 0;
		const maxFrames = 300; // ~5 seconds at 60fps

		const check = () => {
			frameCount++;
			if (chart.isDisposed()) {
				resolve();
				return;
			}
			const cur: [number, number, number, number] = [
				node.clientWidth,
				node.clientHeight,
				chart.getWidth(),
				chart.getHeight()
			];
			if (
				prev &&
				last &&
				prev[0] === last[0] &&
				prev[1] === last[1] &&
				prev[2] === last[2] &&
				prev[3] === last[3] &&
				last[0] === cur[0] &&
				last[1] === cur[1] &&
				last[2] === cur[2] &&
				last[3] === cur[3]
			) {
				resolve();
				return;
			}

			// Safety valve - don't wait forever
			if (frameCount >= maxFrames) {
				resolve();
				return;
			}

			prev = last;
			last = cur;
			requestAnimationFrame(check);
		};
		requestAnimationFrame(check);
	});
}
