import { getContext, setContext } from 'svelte';

export type PageRenderTrackerOptions = {
	/**
	 * How long (ms) `pendingCount` must stay at 0 before `isComplete` becomes true.
	 * This prevents false-positive readiness when child components haven't mounted yet
	 * (e.g. children inside conditionals that register tasks after the parent completes).
	 * Default: 0 (child scopes), 150 (page-level scope)
	 */
	settleMs?: number;
	/**
	 * When true, logs every task registration, completion, and settle event
	 * to the console. Useful for diagnosing PDF readiness issues.
	 */
	debug?: boolean;
};

/**
 * A reactive counter that tracks pending render tasks.
 *
 * ## Hierarchy
 *
 * The readiness system is HIERARCHICAL. The page creates a root tracker,
 * and container components (If, Else, Repeat) create child scopes via
 * `setupContainerReadiness()`. Leaf components register with whatever
 * tracker is in context — either the root or a container's child scope.
 *
 * ## Settle Timer
 *
 * When `pendingCount` drops to 0, `isComplete` does NOT become true
 * immediately. Instead, a settle timer waits `settleMs` to confirm no
 * new tasks register. This is a safety net — the hierarchical model
 * handles most race conditions structurally.
 */
export class PageRenderTracker {
	#pendingCount = $state(0);
	#startedCount = $state(0);
	#settled = $state(false);
	#settleTimer: ReturnType<typeof setTimeout> | undefined;
	#settleDelayMs: number;
	#pendingLabels = $state<string[]>([]);
	#debug: boolean;

	constructor(options?: PageRenderTrackerOptions) {
		this.#settleDelayMs = options?.settleMs ?? 0;
		this.#debug = options?.debug ?? false;
		if (this.#debug) {
			console.log(`[PDF-TRACKER] created | settleMs=${this.#settleDelayMs}`);
		}
	}

	/** Whether debug logging is enabled. Child scopes inherit this. */
	get debug(): boolean {
		return this.#debug;
	}

	/** Number of currently pending (unresolved) tasks. */
	get pendingCount() {
		return this.#pendingCount;
	}

	/** Total number of tasks ever started. */
	get startedCount() {
		return this.#startedCount;
	}

	/**
	 * True when:
	 * 1. At least one task has been started (startedCount > 0)
	 * 2. All tasks have completed (pendingCount === 0)
	 * 3. The pending count has remained at 0 for the settle period
	 */
	get isComplete() {
		return this.#settled;
	}

	/** True when no tasks have ever been started — used by containers to detect "no children". */
	get isEmpty() {
		return this.#startedCount === 0;
	}

	/**
	 * Labels of currently pending tasks. Useful for debugging which
	 * components are blocking readiness during PDF generation.
	 */
	get pendingLabels(): readonly string[] {
		return this.#pendingLabels;
	}

	/**
	 * Register a new pending task. Returns an idempotent completion callback.
	 */
	startTask(label?: string): () => void {
		this.#pendingCount += 1;
		this.#startedCount += 1;

		if (label) {
			this.#pendingLabels = [...this.#pendingLabels, label];
		}

		// New task means we're not settled — cancel any pending settle timer
		this.#settled = false;
		this.#clearSettleTimer();

		if (this.#debug) {
			console.log(
				`[PDF-TRACKER] startTask "${label ?? '?'}" | pending=${this.#pendingCount} started=${this.#startedCount} labels=[${this.#pendingLabels.join(', ')}]`
			);
		}

		let done = false;
		return () => {
			if (done) return;
			done = true;
			this.#pendingCount = Math.max(0, this.#pendingCount - 1);

			if (label) {
				const idx = this.#pendingLabels.indexOf(label);
				if (idx !== -1) {
					this.#pendingLabels = [
						...this.#pendingLabels.slice(0, idx),
						...this.#pendingLabels.slice(idx + 1)
					];
				}
			}

			if (this.#debug) {
				console.log(
					`[PDF-TRACKER] completeTask "${label ?? '?'}" | pending=${this.#pendingCount} started=${this.#startedCount} labels=[${this.#pendingLabels.join(', ')}]`
				);
			}

			this.#scheduleSettle();
		};
	}

	#clearSettleTimer() {
		if (this.#settleTimer !== undefined) {
			clearTimeout(this.#settleTimer);
			this.#settleTimer = undefined;
		}
	}

	/**
	 * Start the settle timer. If `pendingCount` stays at 0 for the settle
	 * period, mark the tracker as settled (isComplete = true).
	 */
	#scheduleSettle() {
		this.#clearSettleTimer();

		if (this.#startedCount > 0 && this.#pendingCount === 0) {
			if (this.#settleDelayMs === 0) {
				// No settle delay — mark complete synchronously
				if (this.#debug) {
					console.log(
						`[PDF-TRACKER] SETTLED (sync) → isComplete=true | started=${this.#startedCount}`
					);
				}
				this.#settled = true;
			} else {
				if (this.#debug) {
					console.log(
						`[PDF-TRACKER] scheduleSettle | waiting ${this.#settleDelayMs}ms`
					);
				}
				this.#settleTimer = setTimeout(() => {
					this.#settleTimer = undefined;
					if (this.#pendingCount === 0 && this.#startedCount > 0) {
						if (this.#debug) {
							console.log(
								`[PDF-TRACKER] SETTLED → isComplete=true | started=${this.#startedCount}`
							);
						}
						this.#settled = true;
					} else if (this.#debug) {
						console.log(
							`[PDF-TRACKER] settle timer fired but state changed | pending=${this.#pendingCount} — NOT settling`
						);
					}
				}, this.#settleDelayMs);
			}
		} else if (this.#debug && this.#startedCount > 0) {
			console.log(
				`[PDF-TRACKER] NOT settling | pending=${this.#pendingCount} > 0`
			);
		}
	}

	/** Clean up timers. Call when the tracker is no longer needed. */
	dispose() {
		this.#clearSettleTimer();
	}
}

const PAGE_RENDER_TRACKER_CONTEXT_KEY = Symbol('PAGE_RENDER_TRACKER_CONTEXT');

export const createPageRenderTrackerContext = (
	options?: PageRenderTrackerOptions
): PageRenderTracker => {
	const tracker = new PageRenderTracker(options);
	setContext(PAGE_RENDER_TRACKER_CONTEXT_KEY, tracker);
	return tracker;
};

export const setPageRenderTrackerContext = (tracker: PageRenderTracker): void => {
	setContext(PAGE_RENDER_TRACKER_CONTEXT_KEY, tracker);
};

export const getPageRenderTrackerContext = (): PageRenderTracker | undefined => {
	return getContext<PageRenderTracker | undefined>(PAGE_RENDER_TRACKER_CONTEXT_KEY);
};
