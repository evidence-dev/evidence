/**
 * Iframe runtime for the JS-enabled custom_echart. Bundled from the shared
 * manifest (core/src/user-components/sandbox/sandbox-runtimes.js) into each host app's
 * static/sandbox/echart-runtime.js and loaded as a classic script inside a
 * `sandbox="allow-scripts"` iframe
 * (opaque origin). Everything here runs UNTRUSTED-adjacent: it evaluates the
 * report author's JavaScript via `new Function`, which is why it lives behind
 * the opaque origin + locked-down CSP (no network egress) rather than in the
 * app's own realm.
 *
 * The trusted parent (CustomEChart.svelte's sandbox path) runs the query and
 * resolves the theme, then posts serializable data in. ECharts renders HERE
 * because user formatter/renderItem functions are invoked synchronously by
 * ECharts and can't cross postMessage.
 *
 * Handshake + message routing + console-error forwarding live in the shared
 * sandbox/runtime-bootstrap module; this file owns only the ECharts-specific
 * pieces (eval, render, theme registration, print-mode stability waits).
 */
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { createTheme } from '../../echarts/echarts-themes';
import { getThemeToken } from '../../../../theme/get-theme-token';
import { withAutoXAxisLabelLayout } from '../../echarts/echarts-utils';
import { buildCustomEchartOptions } from '../build-custom-echart-options';
import { applyFormatCodes } from '../apply-format-codes';
import { formatValue } from '../../../formatValue';
import { formatSettings } from '../../../format-settings';
import { evaluateUserCode as evaluateUserCodeHelper } from './evaluate-user-code';
import {
	SANDBOX_MESSAGE_SOURCE,
	SANDBOX_PROTOCOL_VERSION,
	USER_CODE_GLOBAL_NAMES,
	type InitMessage,
	type ParentToSandboxMessage,
	type SandboxData,
	type SandboxFormatSettings,
	type SandboxMode,
	type SandboxThemes
} from './sandbox-protocol';
import { bootSandbox, type SandboxHost } from '../../../sandbox/runtime-bootstrap';
import { errorToLogEntry } from '../../../sandbox/runtime-diagnostics';

const HEIGHT_REPORT_THRESHOLD_PX = 2;

let chart: echarts.ECharts | undefined;
let container: HTMLElement | undefined;
let host: SandboxHost | undefined;

let userCode = '';
let data: SandboxData = { rows: [], columns: [] };
let themes: SandboxThemes | undefined;
let mode: SandboxMode = 'light';
let useCardColors = false;
let renderer: 'canvas' | 'svg' = 'canvas';
let printing = false;
let formatSettingsValue: SandboxFormatSettings = {};

// Extra vertical space granted to rotated x-axis labels; subtracted back out on
// each layout pass so parent↔iframe height reporting converges instead of
// oscillating (mirrors ECharts.svelte's internalExtraHeight trick).
let extraHeight = 0;
let lastReportedHeight = -1;
let renderedFired = false;
let renderScheduled = false;

function postError(phase: 'eval' | 'render', error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	host?.post({ type: 'error', phase, message });
	// Also forward as a log entry so the AI agent's debug_code tool can see it.
	// Keeping the legacy `error` message for the visual overlay is additive —
	// each uncaught throw produces one of each (display + diagnostic).
	host?.postLog(errorToLogEntry(error));
	// Re-arm `rendered` so the NEXT successful render re-posts it. Without
	// this, the parent sees the first success → marks rendered → clears the
	// overlay. But after an error, no further `rendered` would fire (one-shot
	// guard), so a fix that produces a working chart would leave the overlay
	// stuck on the prior error message even though the chart re-rendered
	// underneath. Resetting the latch makes "render succeeded after error"
	// re-fire the rendered signal, which clears the overlay parent-side.
	// Idempotent on the parent: completeRenderTask is one-shot, and
	// onError(undefined) is the desired effect of any subsequent fire.
	renderedFired = false;
	renderScheduled = false;
}

function makeFmt(settings: SandboxFormatSettings) {
	return (value: unknown, code: string): string =>
		formatValue(
			value,
			code,
			undefined,
			undefined,
			undefined,
			settings.firstDayOfWeek ?? 'sunday',
			settings.decimalSeparator
		);
}

function evaluateUserCode(): Record<string, unknown> {
	const fmt = makeFmt(formatSettingsValue);
	return evaluateUserCodeHelper({
		source: userCode,
		globalNames: USER_CODE_GLOBAL_NAMES,
		globalValues: [data.rows, data.columns, echarts, themes?.[mode], fmt]
	});
}

/** Disable animation in print mode so headless Chromium captures a stable frame. */
function forPrint(option: EChartsOption): EChartsOption {
	if (!printing) return option;
	const opts = { ...(option as Record<string, unknown>) };
	opts.animation = false;
	opts.animationDuration = 0;
	opts.animationDurationUpdate = 0;
	const series = opts.series;
	if (Array.isArray(series)) {
		opts.series = series.map((s) => ({
			...(s as Record<string, unknown>),
			animation: false,
			animationDuration: 0,
			animationDurationUpdate: 0
		}));
	}
	return opts as EChartsOption;
}

function buildOption(): EChartsOption {
	const evaluated = evaluateUserCode();
	const withFormatters = applyFormatCodes(evaluated);
	const columnNames = data.columns.map((column) => column.name);
	const withData = buildCustomEchartOptions(withFormatters, data.rows, columnNames) as Record<
		string,
		unknown
	>;

	// Match ECharts.svelte: author-set colors win, otherwise use the theme palette.
	if (
		!(Array.isArray(withData.color) && withData.color.length > 0) &&
		themes?.[mode]?.colorPalettes?.default
	) {
		withData.color = themes[mode].colorPalettes.default;
	}

	// Tooltips are DOM and would clip at the iframe edge; keep them inside the
	// chart box unless the author opted out. (In-page charts can overflow freely.)
	const tooltip = withData.tooltip;
	if (
		tooltip &&
		typeof tooltip === 'object' &&
		!Array.isArray(tooltip) &&
		(tooltip as Record<string, unknown>).confine === undefined
	) {
		(tooltip as Record<string, unknown>).confine = true;
	}

	return forPrint(withData as EChartsOption);
}

/** Resolve once webfonts are settled; a no-op when the doc has no @font-face. */
async function waitForFonts(): Promise<void> {
	const fonts = (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts;
	if (fonts?.ready && typeof fonts.ready.then === 'function') {
		try {
			await fonts.ready;
		} catch {
			/* ignore */
		}
	}
}

/** Resolve once the chart's reported size stops changing across frames. */
function waitForStableFrames(node: HTMLElement, instance: echarts.ECharts): Promise<void> {
	return new Promise((resolve) => {
		let last: [number, number, number, number] | undefined;
		let prev: [number, number, number, number] | undefined;
		let frames = 0;
		const maxFrames = 300; // ~5s at 60fps safety valve
		const check = () => {
			frames += 1;
			if (instance.isDisposed()) return resolve();
			const cur: [number, number, number, number] = [
				node.clientWidth,
				node.clientHeight,
				instance.getWidth(),
				instance.getHeight()
			];
			const stable =
				prev &&
				last &&
				prev[0] === last[0] &&
				prev[1] === last[1] &&
				prev[2] === last[2] &&
				prev[3] === last[3] &&
				last[0] === cur[0] &&
				last[1] === cur[1] &&
				last[2] === cur[2] &&
				last[3] === cur[3];
			if (stable || frames >= maxFrames) return resolve();
			prev = last;
			last = cur;
			requestAnimationFrame(check);
		};
		requestAnimationFrame(check);
	});
}

// In print mode, hold the `rendered` signal until fonts + layout settle so the
// PDF/screenshot captures a stable frame. In interactive mode, signal as soon as
// ECharts reports the first finished render.
async function signalRendered(): Promise<void> {
	if (renderedFired || renderScheduled) return;
	renderScheduled = true;
	if (printing) {
		await waitForFonts();
		if (chart && container) await waitForStableFrames(container, chart);
	}
	if (renderedFired) return;
	renderedFired = true;
	host?.post({ type: 'rendered' });
}

function reportHeight(): void {
	if (!container) return;
	const baseHeight = Math.max(0, container.clientHeight - extraHeight);
	const contentHeight = baseHeight + extraHeight;
	if (Math.abs(contentHeight - lastReportedHeight) < HEIGHT_REPORT_THRESHOLD_PX) return;
	lastReportedHeight = contentHeight;
	host?.post({ type: 'height', contentHeight });
}

function render(): void {
	if (!container) return;
	try {
		const option = buildOption();
		const laidOut = withAutoXAxisLabelLayout(option, container as HTMLDivElement, extraHeight);
		extraHeight = laidOut.extraHeight;
		chart?.setOption(laidOut.options, { notMerge: true });
		reportHeight();
	} catch (error) {
		postError('eval', error);
	}
}

function registerThemes(): void {
	if (!themes) return;
	echarts.registerTheme('light', createTheme(themes.light, 'light', useCardColors));
	echarts.registerTheme('dark', createTheme(themes.dark, 'dark', useCardColors));
}

/**
 * Paint the iframe body in the parent's resolved theme background. The
 * iframe's srcdoc tries `background: transparent` so the parent shows
 * through, but in Chromium a sandbox="allow-scripts" (no allow-same-origin)
 * frame doesn't actually composite as transparent — the iframe paints
 * white regardless of the document's CSS. That made every JS-mode chart
 * look light-themed in dark mode even though setTheme/reinit had already
 * applied the dark theme correctly to the chart itself (gridlines, axis
 * labels, etc. were dark; only the body background bled through as white).
 *
 * Painting the body with the same color getThemeToken would resolve for a
 * host-rendered <ECharts> at the same position (respects useCardColors so
 * a chart inside a card matches the card's bg) keeps the iframe visually
 * indistinguishable from a non-iframed chart across all modes.
 */
function applyBodyBackground(): void {
	if (!themes) return;
	const bg = getThemeToken(themes[mode], 'background', useCardColors);
	document.body.style.backgroundColor = bg ?? 'transparent';
}

let resizeObserver: ResizeObserver | undefined;

function initChart(): void {
	if (!container) return;
	registerThemes();
	applyBodyBackground();
	chart = echarts.init(container, mode, { renderer: printing ? 'svg' : renderer });
	chart.on('finished', () => {
		reportHeight();
		void signalRendered();
	});
	// Set up the ResizeObserver once — it watches the container, not the chart
	// instance. On theme change we dispose+reinit the chart but keep the
	// container observer alive (without this guard, every theme switch would
	// stack a new observer and re-fire the resize loop multiple times).
	if (!resizeObserver) {
		resizeObserver = new ResizeObserver(() => {
			if (!chart || chart.isDisposed() || !container) return;
			chart.resize({ width: container.clientWidth, height: container.clientHeight });
			render();
		});
		resizeObserver.observe(container);
	}
}

/**
 * Recreate the chart with the current theme/mode. Used on theme messages,
 * because ECharts' chart.setTheme() only updates series colors — it does NOT
 * fully re-apply the new theme's `backgroundColor`, axis label colors, etc.
 * (long-standing ECharts limitation; canonical fix is dispose + reinit).
 * Without this, a chart that initialized with mode='light' before
 * mode-watcher hydrated stays visually light even after a theme message
 * switches mode to 'dark'. Reset the rendered latch so the post-reinit
 * `rendered` re-fires (clears the parent's error overlay, signals readiness).
 */
function reinitChart(): void {
	if (chart && !chart.isDisposed()) chart.dispose();
	chart = undefined;
	renderedFired = false;
	renderScheduled = false;
	initChart();
}

function applyInit(message: InitMessage): void {
	renderer = message.renderer;
	userCode = message.userCode;
	data = message.data;
	themes = message.themes;
	mode = message.mode;
	useCardColors = message.useCardColors;
	printing = message.printing;
	formatSettingsValue = message.formatSettings;
	formatSettings.set({ decimalSeparator: message.formatSettings.decimalSeparator ?? '.' });
	container = document.getElementById('evidence-echart') ?? undefined;
	// reinitChart instead of initChart because applyInit can fire more than
	// once — bootSandbox's dispatch routes port-side init messages back
	// through onInit ("Init can re-fire if the parent reconnects"). A second
	// initChart on a container that already has an ECharts instance throws
	// "There is a chart instance already initialized on the dom." reinitChart
	// disposes the existing chart first (no-op on first call), so this is
	// safe for both the initial and re-init paths.
	reinitChart();
	render();
}

bootSandbox<InitMessage>({
	source: SANDBOX_MESSAGE_SOURCE,
	version: SANDBOX_PROTOCOL_VERSION,
	onInit(init, h) {
		host = h;
		applyInit(init);
	},
	onCapturePng(pixelRatio) {
		// ECharts knows how to render itself to a PNG data URL directly. Use
		// the chart's actual background (transparent in our theme) so the
		// parent's html-to-image composite shows whatever's behind the iframe
		// position in the page — matches what the chart would look like
		// host-rendered.
		if (!chart || chart.isDisposed()) {
			throw new Error('chart not initialized — cannot capture');
		}
		return chart.getDataURL({
			type: 'png',
			pixelRatio,
			backgroundColor: 'transparent'
		});
	},
	onMessage(message) {
		const typed = message as ParentToSandboxMessage;
		switch (typed.type) {
			case 'data':
				data = typed.data;
				render();
				return;
			case 'code':
				userCode = typed.userCode;
				render();
				return;
			case 'theme': {
				if (typed.themes) themes = typed.themes;
				if (typed.mode) mode = typed.mode;
				if (typeof typed.useCardColors === 'boolean') useCardColors = typed.useCardColors;
				// Always reinit. ECharts' chart.setTheme() only re-applies
				// series colors; backgroundColor, axis label colors, gridlines
				// and tooltip styling stay stale. Covers mode flips
				// (light↔dark), card-context changes, AND same-mode
				// project/page theme-config edits (the reason the else branch
				// here was a bug — palette changes look applied but the
				// background and axis labels didn't repaint). ~10ms reinit
				// cost is paid only on theme transitions and is invisible to
				// users.
				reinitChart();
				render();
				return;
			}
			case 'resize':
				if (chart && !chart.isDisposed() && container) {
					chart.resize({ width: container.clientWidth, height: container.clientHeight });
					render();
				}
				return;
		}
	}
});

// Surface async throws (e.g. a formatter that throws on hover) instead of
// silently leaving a half-rendered chart. We use our own listener (not the
// shared installErrorForwarding) so we can ALSO post the visual-overlay
// `error` message; bootSandbox's installConsoleForwarding handles
// console.error/warn separately.
window.addEventListener('error', (event) => postError('render', event.error ?? event.message));
window.addEventListener('unhandledrejection', (event) => postError('render', event.reason));
