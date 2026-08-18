/**
 * Generic correlated request/response over the sandbox MessageChannel.
 *
 * The sandbox protocol is otherwise fire-and-forget (init/data/theme push one
 * way; ready/rendered/height/log report back). A few interactions are
 * genuinely request→response though: the parent asking the iframe to
 * rasterize itself for PNG export, or (the html consumer) author code asking
 * the parent to run a named query. Both directions need the same plumbing —
 * mint a correlation id, await a matching reply, time out a wedged peer.
 *
 * Rather than hand-roll that per consumer (the original `capture-png` did),
 * this is one symmetric primitive both sides instantiate. It owns ONLY
 * correlation; it does not know about the envelope (`source`/`v`/`instanceId`)
 * — the caller's `post` adds that, and the caller feeds already
 * envelope-verified messages into `handleMessage`.
 */

/** A request awaiting a reply on the other end. */
export interface RpcRequestMessage {
	type: 'rpc-request';
	requestId: string;
	/** Operation name; routed to the peer's handler registered under this key. */
	kind: string;
	payload?: unknown;
}

/** The reply to an `RpcRequestMessage`, correlated by `requestId`. */
export interface RpcResponseMessage {
	type: 'rpc-response';
	requestId: string;
	ok: boolean;
	/** Present when `ok` — the handler's return value. */
	result?: unknown;
	/** Present when `!ok` — the handler's thrown message (or "no handler"). */
	error?: string;
}

/** Either a resolved value or a promise of one. */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Handles an inbound request of one `kind`. May be async; may throw (→ error
 * reply). The `MaybePromise` return is documentary — structurally it's still
 * `unknown` — but it signals at the declaration site that async handlers are
 * expected and awaited.
 */
export type RpcHandler = (payload: unknown) => MaybePromise<unknown>;

export interface SandboxRpcOptions {
	/**
	 * Sends a message to the peer. The caller wraps it in the protocol
	 * envelope (and `$state.snapshot`s it on the parent side) — this module
	 * passes plain objects through untouched.
	 */
	post: (message: Record<string, unknown>) => void;
	/** Default per-request timeout. 10s matches the old capture-png ceiling. */
	defaultTimeoutMs?: number;
	/** Override id minting (tests inject a deterministic counter). */
	generateId?: () => string;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function defaultGenerateId(): string {
	return typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `rpc-${Math.random().toString(36).slice(2)}`;
}

interface Pending {
	resolve: (value: unknown) => void;
	reject: (error: Error) => void;
	timer: ReturnType<typeof setTimeout>;
}

export class SandboxRpc {
	readonly #post: (message: Record<string, unknown>) => void;
	readonly #defaultTimeoutMs: number;
	readonly #generateId: () => string;
	readonly #pending = new Map<string, Pending>();
	readonly #handlers = new Map<string, RpcHandler>();
	#disposed = false;

	constructor(opts: SandboxRpcOptions) {
		this.#post = opts.post;
		this.#defaultTimeoutMs = opts.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
		this.#generateId = opts.generateId ?? defaultGenerateId;
	}

	/**
	 * Send a request and await the peer's reply. Rejects if the peer reports
	 * an error, has no handler for `kind`, or doesn't reply within the timeout.
	 */
	request<T = unknown>(kind: string, payload?: unknown, opts?: { timeoutMs?: number }): Promise<T> {
		if (this.#disposed) {
			return Promise.reject(new Error('sandbox channel closed'));
		}
		const requestId = this.#generateId();
		const timeoutMs = opts?.timeoutMs ?? this.#defaultTimeoutMs;
		return new Promise<T>((resolve, reject) => {
			const timer = setTimeout(() => {
				if (this.#pending.delete(requestId)) {
					reject(new Error(`sandbox request "${kind}" timed out after ${timeoutMs}ms`));
				}
			}, timeoutMs);
			this.#pending.set(requestId, {
				resolve: resolve as (value: unknown) => void,
				reject,
				timer
			});
			this.#post({ type: 'rpc-request', requestId, kind, payload });
		});
	}

	/** Register the handler that answers inbound requests of `kind`. */
	setHandler(kind: string, handler: RpcHandler): void {
		this.#handlers.set(kind, handler);
	}

	removeHandler(kind: string): void {
		this.#handlers.delete(kind);
	}

	/**
	 * Feed every inbound, already-envelope-verified message here. Returns
	 * `true` if it was an RPC request/response this instance consumed, `false`
	 * otherwise (so the caller can route lifecycle/consumer messages itself).
	 */
	handleMessage(message: { type?: unknown } | Record<string, unknown>): boolean {
		const type = message?.type;
		if (type === 'rpc-response') {
			this.#handleResponse(message as unknown as RpcResponseMessage);
			return true;
		}
		if (type === 'rpc-request') {
			void this.#handleRequest(message as unknown as RpcRequestMessage);
			return true;
		}
		return false;
	}

	/** Reject every in-flight request; drop handlers. Idempotent. */
	dispose(): void {
		this.#disposed = true;
		for (const pending of this.#pending.values()) {
			clearTimeout(pending.timer);
			pending.reject(new Error('sandbox channel closed'));
		}
		this.#pending.clear();
		this.#handlers.clear();
	}

	#handleResponse(message: RpcResponseMessage): void {
		const pending = this.#pending.get(message.requestId);
		// Unknown id = late reply after timeout/dispose, or a duplicate. Ignore.
		if (!pending) return;
		this.#pending.delete(message.requestId);
		clearTimeout(pending.timer);
		if (message.ok) {
			pending.resolve(message.result);
		} else {
			pending.reject(new Error(message.error ?? 'sandbox request failed'));
		}
	}

	async #handleRequest(message: RpcRequestMessage): Promise<void> {
		const handler = this.#handlers.get(message.kind);
		if (!handler) {
			this.#respond(message.requestId, {
				ok: false,
				error: `No handler registered for request kind "${message.kind}"`
			});
			return;
		}
		try {
			const result = await handler(message.payload);
			this.#respond(message.requestId, { ok: true, result });
		} catch (err) {
			this.#respond(message.requestId, {
				ok: false,
				error: err instanceof Error ? err.message : String(err)
			});
		}
	}

	#respond(
		requestId: string,
		body: { ok: true; result: unknown } | { ok: false; error: string }
	): void {
		// An async handler may resolve AFTER dispose() — e.g. the parent tears
		// down the iframe while a requestHandlers callback is still awaiting.
		// By then SandboxFrame has closed the MessagePort, so posting throws
		// InvalidStateError; since #handleRequest is fired via `void`, that
		// would surface as an unhandled rejection. Drop the stale reply instead.
		if (this.#disposed) return;
		this.#post({ type: 'rpc-response', requestId, ...body });
	}
}
