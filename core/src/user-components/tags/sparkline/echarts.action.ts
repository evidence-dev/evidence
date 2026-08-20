import { init, type EChartsOption, type ECharts } from 'echarts';
import { applyConnectGroup } from '../echarts/echarts.action';

// Manually defining RendererType
type RendererType = 'canvas' | 'svg';

interface EChartsActionOptions {
	options: EChartsOption;
	renderer?: RendererType;
	theme?: string;
	width?: number;
	height?: number;
	onCreate?: (chart: ECharts) => void;
	onDestroy?: () => void;
	onReady?: () => void;
	printing?: boolean;
	group?: string;
}

/**
 * Svelte action for integrating ECharts with Svelte components
 */
export function echarts(node: HTMLElement, options: EChartsActionOptions) {
	// Initialize ECharts instance
	const chart = init(node, options.theme, {
		renderer: options.renderer || 'svg',
		width: options.width,
		height: options.height
	});

	// Set initial options
	chart.setOption(getOptionsForEnvironment(options.options, options.printing));

	// Readiness tracking similar to full ECharts action
	let readyFired = false;
	let readyScheduled = false;
	const fireReadyOnce = () => {
		if (readyFired) return;
		readyFired = true;
		/* ready */
		options.onReady?.();
	};

	const scheduleReadyCheck = () => {
		if (readyScheduled) return;
		readyScheduled = true;

		if (options.printing) {
			// PDF mode: Full expensive readiness check for pixel-perfect rendering
			(async () => {
				/* start */
				await waitForFonts();
				/* fonts */
				await waitForStableFrames(node as HTMLDivElement, chart);
				/* stable */
				fireReadyOnce();
			})();
		} else {
			// Normal UI: Chart events already indicate rendering is complete
			fireReadyOnce();
		}
	};

	const finishedListener = () => {
		/* finished */
		scheduleReadyCheck();
	};
	const renderedListener = () => {
		/* rendered */
		scheduleReadyCheck();
	};

	chart.on('finished', finishedListener);
	chart.on('rendered', renderedListener);
	scheduleReadyCheck();

	// Call onCreate callback if provided
	options.onCreate?.(chart);

	applyConnectGroup(chart, options.group);

	// Create resize observer to handle responsive charts
	const resizeObserver = new ResizeObserver(() => {
		if (chart.isDisposed()) return;
		chart.resize();
	});

	// Start observing for size changes
	resizeObserver.observe(node);

	return {
		// Update handler for when component props change
		update(newOptions: EChartsActionOptions) {
			// Update options
			chart.setOption(
				getOptionsForEnvironment(newOptions.options, newOptions.printing ?? options.printing),
				true
			);

			// Handle theme change by recreating the chart
			if (newOptions.theme !== options.theme) {
				chart.dispose();
				const newChart = init(node, newOptions.theme, {
					renderer: newOptions.renderer || 'svg',
					width: newOptions.width,
					height: newOptions.height
				});
				newChart.setOption(newOptions.options);
				options.onDestroy?.();
				newOptions.onCreate?.(newChart);
				applyConnectGroup(newChart, newOptions.group);
			} else if (newOptions.group !== options.group) {
				applyConnectGroup(chart, newOptions.group);
			}

			// Update size if changed
			if (
				(newOptions.width && newOptions.width !== options.width) ||
				(newOptions.height && newOptions.height !== options.height)
			) {
				chart.resize({
					width: newOptions.width,
					height: newOptions.height
				});
			}

			options = newOptions;
		},

		// Cleanup when component is destroyed
		destroy() {
			try {
				chart.off('finished', finishedListener);
				chart.off('rendered', renderedListener);
			} catch {
				/* ignore */
			}
			resizeObserver.disconnect();
			chart.dispose();
			options.onDestroy?.();
		}
	};
}

function getOptionsForEnvironment(options: EChartsOption, printing?: boolean): EChartsOption {
	if (!printing) return options;
	const opts: EChartsOption = { ...options };
	opts.animation = false;
	opts.animationDuration = 0;
	opts.animationDurationUpdate = 0;
	opts.animationEasing = 'linear';
	opts.animationEasingUpdate = 'linear';
	if (Array.isArray(opts.series)) {
		opts.series = opts.series.map((s) => ({
			...(s as Record<string, unknown>),
			animation: false,
			animationDuration: 0,
			animationDurationUpdate: 0,
			animationEasing: 'linear',
			animationEasingUpdate: 'linear'
		}));
	}
	return opts as EChartsOption;
}

async function waitForFonts(): Promise<void> {
	const doc = document as unknown as { fonts?: { ready?: Promise<void> } };
	const ready = doc?.fonts?.ready;
	if (ready && typeof ready.then === 'function') {
		try {
			await ready;
		} catch {
			/* ignore */
		}
	}
}

async function waitForStableFrames(node: HTMLDivElement, chart: ECharts): Promise<void> {
	return new Promise((resolve) => {
		let last: [number, number, number, number] | undefined;
		let prev: [number, number, number, number] | undefined;
		const check = () => {
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
			prev = last;
			last = cur;
			requestAnimationFrame(check);
		};
		requestAnimationFrame(check);
	});
}
