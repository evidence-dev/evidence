import { onDestroy } from 'svelte';
import {
	PageRenderTracker,
	getPageRenderTrackerContext,
	setPageRenderTrackerContext
} from './page-render-tracker.context.svelte';
import { waitForFonts, waitForStableFrames } from './readiness';

// Track the root tracker so diagnostics can distinguish root vs child-scope
let _lastRootTracker: PageRenderTracker | undefined;

/**
 * Sets up a minimal readiness contract for a LEAF component.
 *
 * - Starts a render task immediately (increments the tracker's pending count)
 * - Watches `isReady()` and when it becomes true it optionally runs `after()` then marks complete
 * - Ensures completion on destroy to avoid leaking pending tasks
 *
 * **Important**: This is for leaf components only (BigValue, Value, Table, etc.).
 * Container components (If, Else, Repeat) should use `setupContainerReadiness()` instead.
 *
 * Usage examples:
 *   // Simple value:
 *   setupRenderReadiness('value', () => !loading && hasValue);
 *
 *   // Table (post-query + fonts):
 *   setupRenderReadiness('table', () => !loading && !error, waitForFonts);
 */
export function setupRenderReadiness(
	componentName: string,
	isReady: () => boolean,
	after?: () => Promise<void>
): void {
	const tracker = getPageRenderTrackerContext();

	// No tracker in context → not in PDF mode. Skip all overhead.
	if (!tracker) return;

	if (tracker.debug) {
		// eslint-disable-next-line no-console
		console.log(
			`[PDF-TRACKER] LEAF "${componentName}" registering | tracker=${tracker === _lastRootTracker ? 'ROOT' : 'CHILD-SCOPE'} started=${tracker.startedCount} pending=${tracker.pendingCount}`
		);
	}
	let mark: (() => void) | undefined = tracker.startTask(componentName);

	$effect(() => {
		if (isReady()) {
			if (after) {
				// Defer async completion to microtask so the effect remains sync
				Promise.resolve()
					.then(() => after())
					.catch(() => {})
					.finally(() => {
						mark?.();
						mark = undefined;
					});
			} else {
				mark?.();
				mark = undefined;
			}
		}
	});

	onDestroy(() => {
		mark?.();
		mark = undefined;
	});
}

/**
 * Call once from the PDF page to tag the root tracker for diagnostics.
 */
export function setRootTrackerRef(tracker: PageRenderTracker): void {
	_lastRootTracker = tracker;
}

/**
 * Sets up a readiness contract for a CONTAINER component that controls
 * the rendering of child components (If, Else, Repeat).
 *
 * This creates a **child scope** — a nested `PageRenderTracker` that
 * descendant components register with instead of the parent tracker.
 * The container's task in the parent tracker completes only when:
 *
 * 1. `isSelfReady()` returns true (the container's own data has loaded)
 * 2. ALL children within the scope have completed their tasks
 *    (or no children were rendered — `childScope.isEmpty`)
 *
 * This eliminates the race condition where a container marks itself ready
 * before its children have mounted and registered their own tasks.
 *
 * Usage:
 *   // In If.svelte:
 *   setupContainerReadiness('if', () => !loading);
 *
 *   // In Else.svelte (waits for conditional to resolve):
 *   setupContainerReadiness('else', () => ctx.isResolved());
 *
 *   // In Repeat.svelte:
 *   setupContainerReadiness('repeat', () => !query.loading);
 */
export function setupContainerReadiness(
	componentName: string,
	isSelfReady: () => boolean
): void {
	const parentTracker = getPageRenderTrackerContext();

	// No tracker in context → not in PDF mode. Skip all overhead.
	if (!parentTracker) return;

	const mark = parentTracker.startTask(componentName);

	if (parentTracker.debug) {
		// eslint-disable-next-line no-console
		console.log(
			`[PDF-TRACKER] CONTAINER "${componentName}" registering | parentTracker=${parentTracker === _lastRootTracker ? 'ROOT' : 'CHILD-SCOPE'} parent.started=${parentTracker.startedCount} parent.pending=${parentTracker.pendingCount}`
		);
	}

	// Create a child scope for descendants to register with.
	// Children call getPageRenderTrackerContext() and get THIS scope
	// instead of the parent tracker.
	const childScope = new PageRenderTracker({
		settleMs: 50, // Short settle — mostly a safety net
		debug: parentTracker.debug
	});

	// Override the context so all descendants of this component
	// register their tasks with the child scope
	setPageRenderTrackerContext(childScope);

	let completed = false;

	$effect(() => {
		if (completed) return;

		const selfReady = isSelfReady();
		// Children are ready if either:
		// - No children registered (isEmpty) — e.g. If condition was false
		// - All registered children have completed (isComplete)
		const childrenReady = childScope.isEmpty || childScope.isComplete;

		if (parentTracker.debug) {
			// eslint-disable-next-line no-console
			console.log(
				`[PDF-TRACKER] CONTAINER "${componentName}" effect | selfReady=${selfReady} childScope.isEmpty=${childScope.isEmpty} childScope.isComplete=${childScope.isComplete} childScope.started=${childScope.startedCount} childScope.pending=${childScope.pendingCount} childScope.labels=[${childScope.pendingLabels.join(', ')}]`
			);
		}

		if (selfReady && childrenReady) {
			completed = true;
			if (parentTracker.debug) {
				// eslint-disable-next-line no-console
				console.log(
					`[PDF-TRACKER] CONTAINER "${componentName}" ✅ COMPLETE | children: started=${childScope.startedCount} pending=${childScope.pendingCount}`
				);
			}
			mark();
		}
	});

	onDestroy(() => {
		// Safety net: if the container unmounts before completing,
		// don't leave a pending task in the parent tracker
		if (!completed) {
			if (parentTracker.debug) {
				// eslint-disable-next-line no-console
				console.log(
					`[PDF-TRACKER] CONTAINER "${componentName}" 🗑️ DESTROYED before completing | childScope.started=${childScope.startedCount} childScope.pending=${childScope.pendingCount}`
				);
			}
			mark();
		}
		childScope.dispose();
	});
}

export { waitForFonts, waitForStableFrames };
