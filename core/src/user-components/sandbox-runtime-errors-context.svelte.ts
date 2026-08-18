/**
 * Page-level aggregator for diagnostics captured inside sandboxed iframes.
 * Read by the AI agent's debug_code tool so it can self-correct against
 * runtime failures it can't see directly.
 *
 * Design: each sandboxed component owns its own ComponentErrorSource (a
 * local $state list of entries) and registers it with this context on
 * mount. The context's snapshot is derived from the union of all
 * registered sources — there is no central mutable buffer.
 *
 * Why this shape:
 *  - Cleanup is automatic. A component unmounting → registry forgets its
 *    source → derived snapshot stops seeing its entries. No "remember to
 *    call clear()" footgun.
 *  - The "reset on edit" case is just `source.clear()` on the component
 *    that owns the source. No cross-cutting tag-and-filter dance.
 *  - The reactive graph runs in one direction: producers (sources) →
 *    derived snapshot. There's no place where the same state is both read
 *    and written in the same reactive context — i.e. no room for the
 *    effect-update-depth loop that the previous central-buffer design
 *    enabled.
 *  - Per-component caps are local to the source, not coordinated across
 *    the whole buffer.
 *
 * Consumers:
 *  - CustomEChart and Html (etc.) call `register(id, type)`
 *    on mount, push entries via `source.report(entry)` from the
 *    iframe's onLog, and call `unregister(id)` on unmount.
 *  - SidepaneChat reads `snapshot()` at submit time to forward to
 *    debug_code. Snapshot is a fresh array of the current union.
 */
import { getContext, setContext, untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { SandboxLogEntry } from './sandbox/log-protocol';

/** A single entry surfaced to the AI agent: the raw log + provenance. */
export type SandboxRuntimeError = SandboxLogEntry & {
	componentId: string;
	componentType: string;
	at: number;
};

/** Per-source cap: a chart spewing warnings on hover can't crowd out others. */
const MAX_PER_COMPONENT = 20;

/**
 * One sandboxed component's local error log. Created via
 * `SandboxRuntimeErrorsContext.register()` and held by the component for
 * the lifetime of its registration. The component pushes entries via
 * `report()`; the page-level context's snapshot folds all registered
 * sources together.
 */
export class ComponentErrorSource {
	readonly componentId: string;
	readonly componentType: string;
	entries = $state<SandboxRuntimeError[]>([]);
	#onReport?: (entry: SandboxRuntimeError) => void;

	constructor(
		componentId: string,
		componentType: string,
		onReport?: (entry: SandboxRuntimeError) => void
	) {
		this.componentId = componentId;
		this.componentType = componentType;
		this.#onReport = onReport;
	}

	report(entry: SandboxLogEntry): void {
		const stamped: SandboxRuntimeError = {
			...entry,
			componentId: this.componentId,
			componentType: this.componentType,
			at: Date.now()
		};
		// untrack the array mutations: push/shift read entries.length internally
		// which would otherwise subscribe any surrounding reactive scope to
		// entries. If someone in the future calls report() from inside a
		// $effect (e.g. a derived "auto-retry" pattern), without this guard
		// the effect would loop. External snapshot consumers still get
		// reactivity from the write itself.
		untrack(() => {
			this.entries.push(stamped);
			while (this.entries.length > MAX_PER_COMPONENT) this.entries.shift();
		});
		// Production telemetry hook — fires AFTER local storage so a failure in
		// the listener (network blip, posthog not loaded) doesn't lose the
		// entry for the AI's debug_code view.
		try {
			this.#onReport?.(stamped);
		} catch {
			/* never let telemetry break the chart */
		}
	}

	/** Reset this component's entries (e.g. after the author edits the body). */
	clear(): void {
		// Same hazard as report: entries.length is a read that would subscribe
		// a calling effect. Idempotency (no reassign when empty) protects
		// against unnecessary re-runs on consumers; untrack on the read
		// protects against a self-feedback loop in the caller.
		if (untrack(() => this.entries.length) > 0) this.entries = [];
	}
}

export class SandboxRuntimeErrorsContext {
	// SvelteMap (not plain Map wrapped in $state): a plain Map inside $state
	// only triggers reactivity on whole-map reassignment, which forced a
	// clone-and-reassign pattern that read AND wrote #sources — the exact
	// read-write-same-state shape that loops when called from a $effect.
	// SvelteMap's set/delete are individually reactive, so register/unregister
	// become pure writes and the caller's $effect doesn't subscribe.
	#sources = new SvelteMap<string, ComponentErrorSource>();
	#onReport?: (entry: SandboxRuntimeError) => void;

	/**
	 * Attach a listener that fires every time any registered source reports
	 * an entry. Used by the studio layer to push errors into production
	 * telemetry (posthog `sandbox-error` event) so we get aggregate signal
	 * about which component types and which kinds of failures show up in the
	 * wild — without coupling the core context to any specific provider.
	 *
	 * Set once at context construction (typically in the editor layout that
	 * also calls setSandboxRuntimeErrorsContext). Replacing the listener
	 * mid-life is supported but probably indicates a layering issue.
	 */
	setReportListener(listener: (entry: SandboxRuntimeError) => void): void {
		this.#onReport = listener;
	}

	/**
	 * Register a component with the context. Returns a source the component
	 * pushes entries to. If the id was previously registered (rare: same id
	 * remounting in dev/HMR), the new source replaces the old one — entries
	 * on the prior instance become unreachable, which matches "remount means
	 * fresh state".
	 */
	register(componentId: string, componentType: string): ComponentErrorSource {
		const source = new ComponentErrorSource(
			componentId,
			componentType,
			(entry) => this.#onReport?.(entry)
		);
		this.#sources.set(componentId, source);
		return source;
	}

	unregister(componentId: string): void {
		this.#sources.delete(componentId);
	}

	/** Fresh array view of every registered source's current entries. */
	snapshot(): SandboxRuntimeError[] {
		const out: SandboxRuntimeError[] = [];
		for (const source of this.#sources.values()) out.push(...source.entries);
		return out;
	}

	/** Number of currently-registered components (for tests + debugging). */
	get size(): number {
		return this.#sources.size;
	}
}

const CONTEXT_KEY = Symbol('sandbox-runtime-errors-context');

export function setSandboxRuntimeErrorsContext(): SandboxRuntimeErrorsContext {
	const ctx = new SandboxRuntimeErrorsContext();
	setContext(CONTEXT_KEY, ctx);
	return ctx;
}

/**
 * Returns the runtime-errors context if one was set higher in the tree
 * (typically by the editor surface where chat lives). Returns undefined
 * outside that context — components fall back silently and the AI just
 * doesn't see those errors. Visual `setError` overlay still fires
 * regardless.
 */
export function getSandboxRuntimeErrorsContext(): SandboxRuntimeErrorsContext | undefined {
	return getContext<SandboxRuntimeErrorsContext | undefined>(CONTEXT_KEY);
}
