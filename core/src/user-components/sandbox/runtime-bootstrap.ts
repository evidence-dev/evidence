/**
 * Iframe-side counterpart to SandboxFrame.svelte: owns the handshake +
 * message-routing scaffold that every sandboxed runtime does identically.
 *
 * The consumer provides an `onInit` handler (called once with the init
 * payload that arrived in the handshake) and an `onMessage` handler (called
 * for every subsequent message). Errors and console output are forwarded
 * via the shared runtime-diagnostics module — no extra wiring needed.
 *
 * Consumers still own:
 *   - `source` (their discriminator) and `version` (their protocol version).
 *   - The InitMessage / subsequent message shapes (typed via generics).
 *   - The actual render logic, exposed back to the parent via the `post`
 *     helper passed to handlers (envelope + identity wrapped).
 */
import { installConsoleForwarding, type PostLog } from './runtime-diagnostics';
import { isSandboxEnvelope as isEnvelopeOfSource, type SandboxEnvelope } from './protocol-base';
import type { SandboxLogEntry, LogMessage } from './log-protocol';
import { SandboxRpc } from './request-response';

/** Outbound message handle handed to consumer code so they don't manage the envelope. */
export interface SandboxHost {
	/** Send a message to the parent over the dedicated channel (post-handshake). */
	post: (message: Record<string, unknown>) => void;
	/** Forward a diagnostic log entry to the parent (matches PostLog). */
	postLog: PostLog;
	/**
	 * Make a correlated request of the parent and await its reply. Used by
	 * consumers whose author-facing API needs data back from the host (e.g.
	 * the html block's `evidence.query(name)`). Rejects on parent-reported
	 * error, missing handler, or timeout. `capture-png` rides the same
	 * channel in the other direction (parent → sandbox, see `onCapturePng`).
	 */
	request: <T = unknown>(
		kind: string,
		payload?: unknown,
		opts?: { timeoutMs?: number }
	) => Promise<T>;
}

export interface BootSandboxOptions<Init extends { type: 'init' }> {
	/** Per-consumer discriminator (must match the parent's). */
	source: string;
	/** Per-consumer protocol version. Mismatch from parent = silent drop on both sides. */
	version: number;
	/** Called once when the handshake completes with the init payload. */
	onInit: (init: Init, host: SandboxHost) => void;
	/**
	 * Called for every subsequent message from the parent. The host is the
	 * SAME instance passed to onInit (stable identity), so consumers can stash
	 * a reference at init-time and ignore the second arg here.
	 */
	onMessage?: (message: { type: string } & Record<string, unknown>, host: SandboxHost) => void;
	/**
	 * Rasterize the consumer's current contents into a PNG data URL. Called
	 * when the parent's PNG export path needs to embed the iframe's contents
	 * (the parent can't see inside cross-origin iframes itself).
	 *
	 * Each consumer implements this differently:
	 *   - custom_echart: `chart.getDataURL({ pixelRatio, backgroundColor: 'transparent' })`
	 *   - html: `htmlToImage.toPng(document.body, { pixelRatio })`
	 *
	 * Throw to signal failure (e.g. chart not yet rendered) — the bootstrap
	 * routes the throw into the response's `error` field so the parent can
	 * fall back gracefully (e.g. skip the iframe in the PNG instead of
	 * blocking the whole export).
	 *
	 * If omitted, capture-png requests are answered with an error response.
	 */
	onCapturePng?: (pixelRatio: number) => Promise<string> | string;
}

/**
 * Boot a sandboxed runtime. Call this once at module top-level (the bundle
 * is loaded as a classic script inside the iframe). Handles:
 *   - Waiting for DOMContentLoaded if needed.
 *   - Installing console.error/warn forwarding.
 *   - Installing window error + unhandledrejection forwarding (consumer can
 *     also forward additional/visual error messages via host.post directly).
 *   - Sending `{ type: 'ready' }` to the parent over the window.
 *   - Receiving the transferred MessageChannel port on the `init` message.
 *   - Dispatching subsequent messages to onMessage.
 *
 * Identity uses the transferred MessageChannel port, not `event.origin` —
 * opaque-origin frames report origin "null", so a port-based identity is
 * the only reliable channel.
 */
export function bootSandbox<Init extends { type: 'init' }>(opts: BootSandboxOptions<Init>): void {
	const { source, version, onInit, onMessage, onCapturePng } = opts;
	let port: MessagePort | undefined;
	let instanceId = '';
	let host: SandboxHost | undefined;
	let rpc: SandboxRpc | undefined;

	function envelope(message: Record<string, unknown>): unknown {
		return { source, v: version, instanceId, ...message };
	}

	function postToParent(message: Record<string, unknown>): void {
		if (port) {
			port.postMessage(envelope(message));
		} else {
			window.parent.postMessage(envelope(message), '*');
		}
	}

	const postLog: PostLog = (entry: SandboxLogEntry) => {
		const log: LogMessage = { type: 'log', entry };
		postToParent(log as unknown as Record<string, unknown>);
	};

	function makeHost(): SandboxHost {
		return {
			post: postToParent,
			postLog,
			request: (kind, payload, requestOpts) => {
				if (!rpc) return Promise.reject(new Error('sandbox channel not connected'));
				return rpc.request(kind, payload, requestOpts);
			}
		};
	}

	let warnedVersionMismatch = false;

	function isOurEnvelope(data: unknown): data is SandboxEnvelope & { type: string } {
		if (!isEnvelopeOfSource(data, source)) return false;
		const incoming = (data as SandboxEnvelope & { v: number }).v;
		if (incoming !== version) {
			if (!warnedVersionMismatch) {
				warnedVersionMismatch = true;
				// console.warn is auto-forwarded to the parent's log pipeline
				// by installConsoleForwarding — one call, both surfaces (the
				// iframe's devtools console AND the parent's debug_code feed).
				// Don't ALSO call host.postLog or the entry doubles up.
				console.warn(
					`[${source}] protocol version mismatch: runtime is v${version}, parent sent v${incoming}. Cached runtime bundle is likely stale; reload to refresh. Messages will be dropped until versions agree.`
				);
			}
			return false;
		}
		return true;
	}

	function dispatch(message: { type: string }): void {
		// capture-png (and any future correlated request from the parent) is
		// claimed by the RPC primitive before consumer routing.
		if (rpc?.handleMessage(message as { type: string } & Record<string, unknown>)) return;
		if (message.type === 'init' && host) {
			// Init can re-fire if the parent reconnects; pass through to onInit
			// so consumers can re-seed state.
			onInit(message as unknown as Init, host);
			return;
		}
		if (host) onMessage?.(message as { type: string } & Record<string, unknown>, host);
	}

	function start(): void {
		installConsoleForwarding(postLog);
		// Note: we deliberately don't call installErrorForwarding here — most
		// consumers want their OWN window.error handler (e.g. for a visual
		// overlay) and would double-fire if both ran. Consumers opt in via
		// installErrorForwarding(host.postLog) inside onInit if they don't
		// need their own handler.
		postToParent({ type: 'ready' });
	}

	window.addEventListener('message', (event: MessageEvent) => {
		if (port) return;
		if (event.source !== window.parent) return;
		if (!isOurEnvelope(event.data) || event.data.type !== 'init') return;
		const [transferred] = event.ports;
		if (!transferred) return;
		port = transferred;
		instanceId = (event.data as { instanceId?: string }).instanceId ?? '';
		rpc = new SandboxRpc({ post: postToParent });
		// The consumer's rasterizer answers the parent's capture-png request.
		// Registered here (not per-consumer) so every sandbox gets PNG export
		// for free by just supplying onCapturePng.
		if (onCapturePng) {
			rpc.setHandler('capture-png', (payload) => {
				const pixelRatio = (payload as { pixelRatio?: number } | undefined)?.pixelRatio ?? 2;
				return onCapturePng(pixelRatio);
			});
		}
		host = makeHost();
		port.onmessage = (portEvent: MessageEvent) => {
			if (isOurEnvelope(portEvent.data)) dispatch(portEvent.data as { type: string });
		};
		onInit(event.data as unknown as Init, host);
	});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
}
