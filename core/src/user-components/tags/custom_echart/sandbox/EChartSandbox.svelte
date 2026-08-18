<script lang="ts">
	import { mode } from 'mode-watcher';
	import { get } from 'svelte/store';
	import type { AnyRowType, Column } from '../../../interfaces/query-service';
	import { getThemeContext } from '../../../../theme/theme.context.svelte';
	import { getCardContext } from '../../../common/card-context.svelte';
	import { getPrintModeContext } from '../../../../print-mode.context';
	import { formatSettings } from '../../../format-settings';
	import SandboxFrame from '../../../sandbox/SandboxFrame.svelte';
	import { getThemeToken } from '../../../../theme/get-theme-token';
	import { SANDBOX_RUNTIME_PATH } from './sandbox-srcdoc';
	import {
		SANDBOX_MESSAGE_SOURCE,
		SANDBOX_PROTOCOL_VERSION,
		type InitMessage,
		type SandboxErrorMessage,
		type SandboxThemes
	} from './sandbox-protocol';
	import type { SandboxLogEntry } from '../../../sandbox/log-protocol';

	type Props = {
		userCode: string;
		rows: AnyRowType[];
		columns: Column[];
		renderer?: 'canvas' | 'svg';
		height?: number;
		class?: string;
		onError?: (message: string | undefined) => void;
		onRendered?: () => void;
		/**
		 * Diagnostics from inside the sandbox (uncaught exceptions, console.error/warn,
		 * future fetch failures). The parent typically pipes these into a ring-buffer
		 * context that the AI agent's debug_code tool reads — separate from `onError`,
		 * which drives the visual error overlay only.
		 */
		onLog?: (entry: SandboxLogEntry) => void;
	};

	let {
		userCode,
		rows,
		columns,
		renderer = 'canvas',
		height,
		class: className,
		onError,
		onRendered,
		onLog
	}: Props = $props();

	const themeContext = getThemeContext();
	const cardContext = getCardContext();
	const printing = getPrintModeContext();

	const useCardColors = $derived(Boolean(cardContext?.insideCard));
	const activeMode = $derived(mode.current === 'dark' ? 'dark' : 'light');
	const themes = $derived<SandboxThemes>({
		light: themeContext.themes.light,
		dark: themeContext.themes.dark
	});

	const instanceId =
		typeof crypto !== 'undefined' && 'randomUUID' in crypto
			? crypto.randomUUID()
			: `ec-${Math.random().toString(36).slice(2)}`;

	const runtimeUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}${SANDBOX_RUNTIME_PATH}?v=${SANDBOX_PROTOCOL_VERSION}`
			: ''
	);

	// Baked into the iframe srcdoc so the first paint matches the parent's
	// theme. Without this, the iframe shows the browser default body color
	// (white) for ~50–200ms while the runtime bundle loads and executes its
	// own applyBodyBackground — visible as a flash, loud in dark mode.
	const initialBackgroundColor = $derived(
		getThemeToken(themes[activeMode], 'background', useCardColors) ?? 'transparent'
	);

	const init = $derived<InitMessage>({
		type: 'init',
		renderer,
		userCode,
		data: { rows, columns },
		themes,
		mode: activeMode,
		useCardColors,
		formatSettings: { decimalSeparator: get(formatSettings).decimalSeparator },
		printing
	});

	let postToFrame = $state<((message: Record<string, unknown>) => void) | undefined>();

	// Mirror of what the sandbox last received, so a filter change reposts only
	// rows, a keystroke only code, a theme toggle only the theme. Seeded with
	// the values that went out in the init payload at connect time.
	let sent: {
		userCode: string;
		rows: AnyRowType[];
		columns: Column[];
		themes: SandboxThemes;
		mode: 'light' | 'dark';
		useCardColors: boolean;
	} | null = null;

	function onConnect(post: (message: Record<string, unknown>) => void): void {
		postToFrame = post;
		sent = { userCode, rows, columns, themes, mode: activeMode, useCardColors };
	}

	$effect(() => {
		if (!postToFrame || !sent) return;
		if (userCode !== sent.userCode) {
			postToFrame({ type: 'code', userCode });
			sent.userCode = userCode;
		}
		if (rows !== sent.rows || columns !== sent.columns) {
			postToFrame({ type: 'data', data: { rows, columns } });
			sent.rows = rows;
			sent.columns = columns;
		}
		if (
			themes !== sent.themes ||
			activeMode !== sent.mode ||
			useCardColors !== sent.useCardColors
		) {
			postToFrame({ type: 'theme', themes, mode: activeMode, useCardColors });
			sent.themes = themes;
			sent.mode = activeMode;
			sent.useCardColors = useCardColors;
		}
	});

	// ECharts' visual error overlay flows through the consumer-specific 'error'
	// message (with phase: eval | render). SandboxFrame surfaces non-lifecycle
	// messages via onMessage so the consumer routes them itself.
	function handleEchartMessage(message: { type: string } & Record<string, unknown>): void {
		if (message.type === 'error') {
			onError?.((message as unknown as SandboxErrorMessage).message);
		}
	}
</script>

<SandboxFrame
	source={SANDBOX_MESSAGE_SOURCE}
	version={SANDBOX_PROTOCOL_VERSION}
	{instanceId}
	{runtimeUrl}
	bodyHtml={'<style>#evidence-echart { width: 100%; height: 100%; }</style><div id="evidence-echart"></div>'}
	{initialBackgroundColor}
	{init}
	taskName="custom_echart"
	title="Custom chart"
	{height}
	minHeight={215}
	class={className}
	{onRendered}
	{onError}
	{onLog}
	{onConnect}
	onMessage={handleEchartMessage}
/>
