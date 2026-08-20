<script lang="ts" generics="Init extends { type: 'init' }">
	/**
	 * Generic base for parent-side sandbox wrappers. Owns the bits every
	 * sandboxed component does identically: srcdoc rendering, opaque-origin
	 * iframe, MessageChannel handshake, lifecycle message routing
	 * (`ready` → connect, `rendered`/`error`/`height`/`log`), render-tracker
	 * integration with a wedged-iframe fallback, and cleanup on unmount.
	 *
	 * Consumers (CustomEChart, Html, …) compose this and own:
	 *  - The `Init` payload shape (typed via the component generic).
	 *  - Reactivity for posting subsequent updates — read `connected` and
	 *    call `post(message)` from a $effect that dedupes against last-sent.
	 *  - Handling any non-lifecycle messages via `onMessage` (e.g. echart's
	 *    visual `error` overlay, html's future custom signals).
	 */
	import { onMount, untrack } from 'svelte';
	import { cn } from '../../shadcn/utils';
	import { getPageRenderTrackerContext } from '../../page-render-tracker.context.svelte';
	import { buildSandboxSrcdoc } from './srcdoc';
	import {
		isSandboxEnvelope as isEnvelopeOfSource,
		validateHeightMessage,
		type HeightMessage,
		type ReadyMessage,
		type RenderedMessage,
		type SandboxEnvelope
	} from './protocol-base';
	import { validateLogMessage, type SandboxLogEntry, type LogMessage } from './log-protocol';
	import {
		registerSandboxFrameCapture,
		unregisterSandboxFrameCapture
	} from './png-capture-registry';
	import { SandboxRpc, type RpcHandler } from './request-response';

	/**
	 * Inbound messages every sandbox sends. Consumer-specific messages (e.g.
	 * echart's overlay error) flow through `onMessage` instead.
	 */
	type BaseInboundMessage = ReadyMessage | RenderedMessage | HeightMessage | LogMessage;

	type Props = {
		/** Per-consumer discriminator so messages from sibling sandboxes don't cross. */
		source: string;
		/** Per-consumer protocol version. Sandbox runtime asserts equality. */
		version: number;
		/** Unique per frame instance (multiple sandboxes on one page). */
		instanceId: string;
		/** URL of the consumer's runtime bundle (version-pinned by the consumer). */
		runtimeUrl: string;
		/**
		 * Markup placed inside the iframe `<body>` before the runtime script.
		 * Pinned at iframe creation (read untracked) — see the srcdoc
		 * invariance contract in `srcdoc.ts`. If your consumer needs to vary
		 * styling at runtime (autosize vs fixed, light vs dark structural CSS),
		 * encode every variant here as class-gated rules and toggle the class
		 * on `<body>` from the iframe runtime via your state-change channel.
		 */
		bodyHtml?: string;
		/**
		 * Background color painted on the iframe body in the srcdoc itself, so
		 * the first frame matches the parent's theme instead of flashing
		 * browser-default white while the runtime bundle loads. Consumers
		 * compute this from their resolved theme. Reactive — when this
		 * changes (e.g. mode toggle), the srcdoc rebuilds and the iframe
		 * reloads with the new color baked in.
		 */
		initialBackgroundColor?: string;

		/** Initial payload sent at handshake time. Read once on `ready`. */
		init: Init;

		/** Render-tracker task name (used for PDF/capture readiness signaling). */
		taskName: string;
		/** Accessibility title on the iframe element. */
		title?: string;

		/** Fixed height (px). When omitted, height tracks sandbox-reported content. */
		height?: number;
		/** Floor for the wrapper when no fixed height is set. */
		minHeight?: number;
		class?: string;

		// ---- Lifecycle callbacks ----
		onRendered?: () => void;
		/** Visual error overlay hook — consumers pipe their own error messages here. */
		onError?: (message: string | undefined) => void;
		/** Diagnostics for the AI agent's debug_code pipeline (ring buffer). */
		onLog?: (entry: SandboxLogEntry) => void;
		/** Fires when the sandbox reports content height (when height prop is unset). */
		onHeight?: (contentHeight: number) => void;
		/**
		 * Any inbound message that isn't a base lifecycle message
		 * (ready/rendered/height/log). Use for consumer-specific message types.
		 */
		onMessage?: (message: { type: string } & Record<string, unknown>) => void;

		/**
		 * Fired once with a `post` function consumers can call to send subsequent
		 * messages (after the handshake completes). Callback-based instead of an
		 * imperative `bind:this` to keep the API type-friendly across the generic.
		 */
		onConnect?: (post: (message: Record<string, unknown>) => void) => void;

		/**
		 * Handlers for requests the SANDBOX makes of the parent (e.g. the html
		 * block's `evidence.query(name)`). Keyed by request kind; each receives
		 * the request payload and returns (or resolves) the result, which is
		 * sent back over the correlated RPC channel. Registered once at connect
		 * time — read fresh reactive state inside the handler body, don't rely on
		 * re-registration.
		 */
		requestHandlers?: Record<string, RpcHandler>;

		/**
		 * Build the iframe document's CSP from its origin. Omit for the
		 * locked-down default (custom_echart). Consumers that need a different
		 * policy (allowlisted CDN scripts, opt-in network) pass a builder here.
		 */
		buildCsp?: (origin: string) => string;
	};

	let {
		source,
		version,
		instanceId,
		runtimeUrl,
		bodyHtml = '',
		initialBackgroundColor,
		init,
		taskName,
		title,
		height,
		minHeight,
		class: className,
		onRendered,
		onError,
		onLog,
		onHeight,
		onMessage,
		onConnect,
		requestHandlers,
		buildCsp
	}: Props = $props();

	let connected = false;

	const renderTracker = getPageRenderTrackerContext();

	let iframeEl: HTMLIFrameElement | undefined = $state();
	let origin = $state('');
	let port: MessagePort | undefined;
	let rpc: SandboxRpc | undefined;
	let reportedHeight = $state(0);
	let markRenderComplete: (() => void) | undefined;
	// Tracks whether the sandbox has posted its first 'rendered' lifecycle
	// message. Gates capture-png requests — capturing before the chart
	// renders would either fail (no chart instance to call getDataURL on)
	// or return a blank PNG, both worse than waiting.
	let hasRendered = false;

	// `bodyHtml` and `initialBackgroundColor` are read untracked so any
	// reactivity in a consumer (intentional or accidental) cannot change the
	// srcdoc attribute mid-life. A changed srcdoc forces the browser to reload
	// the iframe — wiping the SDK, DOM, and message port — with no native
	// hook for the parent to know it needs to re-handshake. See the srcdoc
	// invariance contract in `srcdoc.ts`. The captured values are correct at
	// first srcdoc construction (onMount, after `origin` is set); later
	// changes are handled in-place by the consumer via its post-handshake
	// channel (theme/state messages, class toggles on body).
	const srcdoc = $derived(
		origin
			? buildSandboxSrcdoc({
					origin,
					runtimeUrl,
					bodyHtml: untrack(() => bodyHtml),
					initialBackgroundColor: untrack(() => initialBackgroundColor),
					csp: buildCsp ? buildCsp(origin) : undefined
				})
			: ''
	);

	let warnedVersionMismatch = false;

	function isOurEnvelope(data: unknown): data is SandboxEnvelope & { type: string } {
		if (!isEnvelopeOfSource(data, source)) return false;
		const incoming = (data as SandboxEnvelope & { v: number }).v;
		if (incoming !== version) {
			if (!warnedVersionMismatch) {
				warnedVersionMismatch = true;
				const detail = `[${source}] protocol version mismatch: parent is v${version}, sandbox sent v${incoming}. Cached runtime bundle is likely stale; reload to refresh. Messages will be dropped until versions agree.`;
				console.warn(detail);
				// Surface to the visual error overlay so the human sees something
				// instead of a silently-blank chart.
				onError?.(detail);
			}
			return false;
		}
		return true;
	}

	function completeRenderTask(): void {
		markRenderComplete?.();
		markRenderComplete = undefined;
	}

	function handleInbound(
		message: BaseInboundMessage | ({ type: string } & Record<string, unknown>)
	): void {
		// Correlated request/response (capture-png today, more later) is owned
		// by the shared RPC primitive — let it claim its messages first.
		if (rpc?.handleMessage(message)) return;
		switch (message.type) {
			case 'rendered':
				hasRendered = true;
				onError?.(undefined);
				onRendered?.();
				completeRenderTask();
				return;
			case 'height': {
				// Drop bad payloads (NaN/Infinity/negative/non-number) — they'd
				// either break the layout calc or trip a CSS warning. The
				// runtime bundle is the only producer; a bad value here means
				// either a bug or a tampered bundle. Silent drop is fine.
				const validated = validateHeightMessage(message);
				if (!validated) return;
				if (height === undefined) reportedHeight = validated.contentHeight;
				onHeight?.(validated.contentHeight);
				return;
			}
			case 'log': {
				const validated = validateLogMessage(message);
				if (!validated) return;
				onLog?.(validated.entry);
				return;
			}
			case 'ready':
				// Handled separately on the window-message path during handshake.
				return;
		}
		// Anything else is consumer-specific.
		onMessage?.(message as { type: string } & Record<string, unknown>);
	}

	// 10s timeout is generous — ECharts getDataURL is synchronous and
	// html-to-image inside an iframe is also fast (~100ms for typical content);
	// 10s is a "the iframe is wedged" ceiling, not an expected duration.
	const CAPTURE_TIMEOUT_MS = 10_000;

	function requestPng(pixelRatio: number): Promise<string> {
		if (!rpc || !connected) return Promise.reject(new Error('sandbox not connected'));
		if (!hasRendered) {
			return Promise.reject(new Error('sandbox has not rendered yet — cannot capture'));
		}
		return rpc.request<string>('capture-png', { pixelRatio }, { timeoutMs: CAPTURE_TIMEOUT_MS });
	}

	/**
	 * Wrap any outbound message in the envelope and snapshot it. `$state.snapshot`
	 * strips Svelte 5 reactive proxies into plain values — without it,
	 * `postMessage`'s structured clone throws DataCloneError on arrays/objects
	 * that came from $state (e.g. query.result.rows). Safe to apply
	 * unconditionally; non-proxied values pass through unchanged.
	 */
	function envelope(message: Record<string, unknown>): unknown {
		return $state.snapshot({ source, v: version, instanceId, ...message });
	}

	function post(message: Record<string, unknown>): void {
		port?.postMessage(envelope(message));
	}

	// Dispose the current handshake channel. The port, RPC, and PNG-capture
	// registration all belong to ONE specific iframe document; when that
	// document goes away (reload or unmount) they must be torn down before a
	// fresh handshake, or stale messages/handlers cross between documents.
	function teardownChannel(): void {
		rpc?.dispose();
		rpc = undefined;
		port?.close();
		port = undefined;
		if (iframeEl) unregisterSandboxFrameCapture(iframeEl);
		connected = false;
		// The reloaded document hasn't rendered yet; don't let a stale "rendered"
		// let capture fire on a blank frame.
		hasRendered = false;
	}

	// Re-entrant handshake, driven by the iframe's `ready`. `bootSandbox` posts
	// exactly ONE `ready` per document boot — the first load AND every reload.
	// A reload happens whenever the browser re-parents the iframe (the editor's
	// virtualized preview moves it in the DOM on navigation), silently killing
	// the old document, port, and SDK. Without re-handshaking, the reloaded
	// frame waits forever for an init sent to the dead document and the block
	// stays blank until a full page refresh. So on every `ready` we tear down
	// any prior channel and establish a new one — the block renders whenever the
	// page shows it, not only the first time. (We deliberately do NOT also
	// connect on the iframe's `load` event: it fires after `ready`, so a
	// teardown there would kill the channel we just built.)
	function connect(): void {
		if (!iframeEl?.contentWindow) return;
		teardownChannel();
		const channel = new MessageChannel();
		port = channel.port1;
		rpc = new SandboxRpc({ post });
		if (requestHandlers) {
			for (const [kind, handler] of Object.entries(requestHandlers)) {
				rpc.setHandler(kind, handler);
			}
		}
		port.onmessage = (event: MessageEvent) => {
			if (isOurEnvelope(event.data)) {
				handleInbound(event.data as unknown as BaseInboundMessage);
			}
		};
		connected = true;
		// Initial handshake message goes via window.postMessage (the channel port
		// doesn't exist on the sandbox side yet; it's transferred IN this message).
		iframeEl.contentWindow.postMessage(envelope({ ...init }), '*', [channel.port2]);
		// Register for PNG export — the parent's html-to-image path uses this
		// to find sandboxed iframes and rasterize their contents (which it
		// can't do directly because of cross-origin isolation). Registered
		// AFTER connection so requestPng is callable.
		if (iframeEl) registerSandboxFrameCapture(iframeEl, requestPng);
		onConnect?.(post);
	}

	onMount(() => {
		origin = window.location.origin;
		markRenderComplete = renderTracker?.startTask(taskName);
		// Safety net for a wedged iframe (failed load, runaway user JS) OR a
		// sandbox that never posts 'rendered' (e.g. an html block with a script
		// that forgot evidence.ready()). Release the render task so PDF/capture
		// readiness doesn't hang forever, and enable PNG as a last resort — by
		// 20s any async draw has surely finished, so capturing is better than a
		// permanently-disabled export.
		const fallback = setTimeout(() => {
			hasRendered = true;
			completeRenderTask();
		}, 20_000);

		// A sandbox that never handshakes is either wedged author code or a host
		// that isn't serving the runtime bundle at all. Probe before blaming the
		// author: a failed fetch means the host skipped its `build:sandbox` step,
		// which otherwise surfaces only as a block that sits blank until the 20s
		// fallback above. A slow-but-healthy load still answers this fetch, so it
		// can't produce a false positive.
		const runtimeProbe = setTimeout(async () => {
			if (connected) return;
			let detail: string | undefined;
			try {
				const response = await fetch(runtimeUrl);
				if (!response.ok) detail = `responded HTTP ${response.status}`;
			} catch {
				detail = 'could not be fetched';
			}
			if (!detail || connected) return;
			const message = `[${source}] sandbox runtime ${detail} at ${runtimeUrl} — the host app is not serving it. Run its \`build:sandbox\` step.`;
			console.error(message);
			onError?.(message);
		}, 4_000);

		const onWindowMessage = (event: MessageEvent) => {
			if (event.source !== iframeEl?.contentWindow) return;
			if (!isOurEnvelope(event.data)) return;
			if ((event.data as { type?: string }).type === 'ready') connect();
		};
		window.addEventListener('message', onWindowMessage);

		return () => {
			clearTimeout(fallback);
			clearTimeout(runtimeProbe);
			window.removeEventListener('message', onWindowMessage);
			teardownChannel();
			// Releasing without a render shouldn't keep the page "loading".
			completeRenderTask();
		};
	});
</script>

<div
	class={cn(className, 'relative w-full')}
	class:h-full={!height}
	style:height={height ? `${height}px` : undefined}
	style:min-height={height === undefined && minHeight
		? `${Math.max(minHeight, reportedHeight)}px`
		: undefined}
>
	{#if srcdoc}
		<iframe
			bind:this={iframeEl}
			{title}
			{srcdoc}
			sandbox="allow-scripts"
			referrerpolicy="no-referrer"
			class="absolute inset-0 h-full w-full border-0"
		></iframe>
	{/if}
</div>
