import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PageRenderTracker } from './page-render-tracker.context.svelte';

describe('PageRenderTracker', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('initial state', () => {
		it('starts with zero counts', () => {
			const tracker = new PageRenderTracker();
			expect(tracker.pendingCount).toBe(0);
			expect(tracker.startedCount).toBe(0);
		});

		it('starts as not complete', () => {
			const tracker = new PageRenderTracker();
			expect(tracker.isComplete).toBe(false);
		});

		it('starts as empty', () => {
			const tracker = new PageRenderTracker();
			expect(tracker.isEmpty).toBe(true);
		});

		it('starts with no pending labels', () => {
			const tracker = new PageRenderTracker();
			expect(tracker.pendingLabels).toEqual([]);
		});

		it('debug defaults to false', () => {
			const tracker = new PageRenderTracker();
			expect(tracker.debug).toBe(false);
		});

		it('debug can be set to true', () => {
			const tracker = new PageRenderTracker({ debug: true });
			expect(tracker.debug).toBe(true);
		});
	});

	describe('startTask', () => {
		it('increments pending and started counts', () => {
			const tracker = new PageRenderTracker();
			tracker.startTask('test');
			expect(tracker.pendingCount).toBe(1);
			expect(tracker.startedCount).toBe(1);
		});

		it('no longer isEmpty after starting a task', () => {
			const tracker = new PageRenderTracker();
			tracker.startTask('test');
			expect(tracker.isEmpty).toBe(false);
		});

		it('tracks labels', () => {
			const tracker = new PageRenderTracker();
			tracker.startTask('alpha');
			tracker.startTask('beta');
			expect(tracker.pendingLabels).toEqual(['alpha', 'beta']);
		});

		it('handles tasks without labels', () => {
			const tracker = new PageRenderTracker();
			tracker.startTask();
			expect(tracker.pendingCount).toBe(1);
			expect(tracker.pendingLabels).toEqual([]);
		});

		it('resets settled state when new task is added', () => {
			const tracker = new PageRenderTracker({ settleMs: 0 });
			const mark = tracker.startTask('first');
			mark(); // complete → should settle
			expect(tracker.isComplete).toBe(true);

			tracker.startTask('second'); // new task → unsettled
			expect(tracker.isComplete).toBe(false);
		});
	});

	describe('task completion', () => {
		it('decrements pending count', () => {
			const tracker = new PageRenderTracker();
			const mark = tracker.startTask('test');
			expect(tracker.pendingCount).toBe(1);
			mark();
			expect(tracker.pendingCount).toBe(0);
		});

		it('does not decrement started count', () => {
			const tracker = new PageRenderTracker();
			const mark = tracker.startTask('test');
			mark();
			expect(tracker.startedCount).toBe(1);
		});

		it('removes label on completion', () => {
			const tracker = new PageRenderTracker();
			const mark = tracker.startTask('alpha');
			tracker.startTask('beta');
			mark();
			expect(tracker.pendingLabels).toEqual(['beta']);
		});

		it('is idempotent — calling completion twice does not double-decrement', () => {
			const tracker = new PageRenderTracker();
			const mark = tracker.startTask('test');
			mark();
			mark(); // second call should be no-op
			expect(tracker.pendingCount).toBe(0);
			expect(tracker.startedCount).toBe(1);
		});

		it('pending count cannot go below zero', () => {
			const tracker = new PageRenderTracker();
			const mark = tracker.startTask('test');
			mark();
			// Even if something weird happens, pending stays at 0
			expect(tracker.pendingCount).toBe(0);
		});
	});

	describe('isComplete with settleMs=0 (sync settle)', () => {
		it('becomes true when all tasks complete', () => {
			const tracker = new PageRenderTracker({ settleMs: 0 });
			const mark = tracker.startTask('test');
			expect(tracker.isComplete).toBe(false);
			mark();
			expect(tracker.isComplete).toBe(true);
		});

		it('stays false with pending tasks', () => {
			const tracker = new PageRenderTracker({ settleMs: 0 });
			const mark1 = tracker.startTask('a');
			const mark2 = tracker.startTask('b');
			mark1();
			expect(tracker.isComplete).toBe(false);
			mark2();
			expect(tracker.isComplete).toBe(true);
		});

		it('is false when no tasks have been started (empty)', () => {
			const tracker = new PageRenderTracker({ settleMs: 0 });
			expect(tracker.isComplete).toBe(false);
			expect(tracker.isEmpty).toBe(true);
		});

		it('resets when new task is added after settling', () => {
			const tracker = new PageRenderTracker({ settleMs: 0 });
			const mark1 = tracker.startTask('a');
			mark1();
			expect(tracker.isComplete).toBe(true);

			const mark2 = tracker.startTask('b');
			expect(tracker.isComplete).toBe(false);
			mark2();
			expect(tracker.isComplete).toBe(true);
		});
	});

	describe('isComplete with settleMs > 0 (async settle)', () => {
		it('does not become true immediately', () => {
			const tracker = new PageRenderTracker({ settleMs: 100 });
			const mark = tracker.startTask('test');
			mark();
			expect(tracker.isComplete).toBe(false);
		});

		it('becomes true after settle delay', () => {
			const tracker = new PageRenderTracker({ settleMs: 100 });
			const mark = tracker.startTask('test');
			mark();
			vi.advanceTimersByTime(100);
			expect(tracker.isComplete).toBe(true);
		});

		it('cancels settle timer when new task is added', () => {
			const tracker = new PageRenderTracker({ settleMs: 100 });
			const mark1 = tracker.startTask('a');
			mark1();
			vi.advanceTimersByTime(50); // Halfway through settle
			expect(tracker.isComplete).toBe(false);

			const mark2 = tracker.startTask('b'); // New task cancels settle
			vi.advanceTimersByTime(100); // Old settle time passes
			expect(tracker.isComplete).toBe(false); // Still not settled

			mark2();
			vi.advanceTimersByTime(100); // New settle timer
			expect(tracker.isComplete).toBe(true);
		});

		it('does not settle if task completed during delay', () => {
			const tracker = new PageRenderTracker({ settleMs: 100 });
			const mark1 = tracker.startTask('a');
			mark1();

			// Before settle fires, add and leave a task pending
			vi.advanceTimersByTime(50);
			tracker.startTask('b'); // pending=1

			vi.advanceTimersByTime(100); // Original settle timer fires
			expect(tracker.isComplete).toBe(false); // Pending > 0
		});
	});

	describe('multiple tasks', () => {
		it('handles interleaved start/complete correctly', () => {
			const tracker = new PageRenderTracker({ settleMs: 0 });

			const a = tracker.startTask('a');
			const b = tracker.startTask('b');
			const c = tracker.startTask('c');

			expect(tracker.pendingCount).toBe(3);
			expect(tracker.startedCount).toBe(3);

			b(); // Complete b first (out of order)
			expect(tracker.pendingCount).toBe(2);
			expect(tracker.pendingLabels).toEqual(['a', 'c']);

			a();
			expect(tracker.pendingCount).toBe(1);
			expect(tracker.pendingLabels).toEqual(['c']);
			expect(tracker.isComplete).toBe(false);

			c();
			expect(tracker.pendingCount).toBe(0);
			expect(tracker.isComplete).toBe(true);
		});

		it('handles duplicate labels correctly', () => {
			const tracker = new PageRenderTracker({ settleMs: 0 });

			const a1 = tracker.startTask('sparkline');
			const a2 = tracker.startTask('sparkline');

			expect(tracker.pendingLabels).toEqual(['sparkline', 'sparkline']);

			a1();
			// Only removes the first occurrence
			expect(tracker.pendingLabels).toEqual(['sparkline']);

			a2();
			expect(tracker.pendingLabels).toEqual([]);
			expect(tracker.isComplete).toBe(true);
		});
	});

	describe('dispose', () => {
		it('clears settle timer', () => {
			const tracker = new PageRenderTracker({ settleMs: 100 });
			const mark = tracker.startTask('test');
			mark();
			expect(tracker.isComplete).toBe(false);

			tracker.dispose();
			vi.advanceTimersByTime(200);
			// After dispose, settle timer should have been cleared
			// isComplete stays false because the timer was cancelled
			expect(tracker.isComplete).toBe(false);
		});
	});

	describe('container readiness pattern', () => {
		it('child scope isEmpty when no children register', () => {
			const parent = new PageRenderTracker({ settleMs: 0 });
			const child = new PageRenderTracker({ settleMs: 0 });

			parent.startTask('container');
			expect(child.isEmpty).toBe(true);
			expect(child.isComplete).toBe(false);
		});

		it('child scope completes when all child tasks complete', () => {
			const child = new PageRenderTracker({ settleMs: 0 });
			const a = child.startTask('leaf-a');
			const b = child.startTask('leaf-b');

			expect(child.isComplete).toBe(false);
			a();
			expect(child.isComplete).toBe(false);
			b();
			expect(child.isComplete).toBe(true);
		});

		it('simulates full container lifecycle', () => {
			const parent = new PageRenderTracker({ settleMs: 0 });

			// Container registers with parent
			const markContainer = parent.startTask('if');
			expect(parent.pendingCount).toBe(1);

			// Create child scope
			const child = new PageRenderTracker({ settleMs: 0 });

			// Children register with child scope
			const markLeaf = child.startTask('big-value');

			// Container checks: self ready? children ready?
			const selfReady = true; // query loaded
			const childrenReady = child.isEmpty || child.isComplete;
			expect(childrenReady).toBe(false); // child has pending task

			// Child completes
			markLeaf();
			const childrenReadyNow = child.isEmpty || child.isComplete;
			expect(childrenReadyNow).toBe(true);

			// Container completes
			if (selfReady && childrenReadyNow) {
				markContainer();
			}
			expect(parent.pendingCount).toBe(0);
			expect(parent.isComplete).toBe(true);
		});

		it('simulates container with no rendered children (false condition)', () => {
			const parent = new PageRenderTracker({ settleMs: 0 });

			// Container registers with parent
			const markContainer = parent.startTask('if');

			// Create child scope
			const child = new PageRenderTracker({ settleMs: 0 });

			// No children register (condition was false)
			const selfReady = true;
			const childrenReady = child.isEmpty || child.isComplete;
			expect(child.isEmpty).toBe(true);
			expect(childrenReady).toBe(true);

			// Container completes immediately
			if (selfReady && childrenReady) {
				markContainer();
			}
			expect(parent.isComplete).toBe(true);
		});

		it('simulates nested containers', () => {
			const root = new PageRenderTracker({ settleMs: 0 });

			// Outer If
			const markIf = root.startTask('if');
			const ifChild = new PageRenderTracker({ settleMs: 0 });

			// Inner Repeat (registers with If's child scope)
			const markRepeat = ifChild.startTask('repeat');
			const repeatChild = new PageRenderTracker({ settleMs: 0 });

			// Leaf inside Repeat
			const markLeaf = repeatChild.startTask('table');

			// Nothing is ready yet
			expect(root.isComplete).toBe(false);
			expect(ifChild.isComplete).toBe(false);
			expect(repeatChild.isComplete).toBe(false);

			// Leaf completes
			markLeaf();
			expect(repeatChild.isComplete).toBe(true);

			// Repeat sees children ready, completes in parent (ifChild)
			markRepeat();
			expect(ifChild.isComplete).toBe(true);

			// If sees children ready, completes in root
			markIf();
			expect(root.isComplete).toBe(true);
		});
	});
});
