import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActiveDagNode, DagNode, PassiveDagNode } from './DagNode.js';
const noop = () => true;

describe('DagNode', () => {
	afterEach(() => {
		vi.useRealTimers();
	});
	describe('Dirty nodes', () => {
		it('should be dirty and clean', async () => {
			const epoch = Symbol('');
			const node = new ActiveDagNode('name', noop);
			expect(node.dirty).toBe(false);
			node.markDirty(epoch);
			expect(node.dirty).toBe(true);
			await node.flush(epoch);
			expect(node.dirty).toBe(false);
		});

		it('should pass dirty to children', () => {
			const parent = new ActiveDagNode('parent', noop);
			const child = new ActiveDagNode('child', noop);

			child.registerDependency(parent);

			parent.markChildrenDirty();
			expect(child.dirty).toBe(true);
		});
	});

	describe('Execution', () => {
		it('should execute each node at most once', async () => {
			const exec = vi.fn(() => true);

			const root = new ActiveDagNode('root', () => exec('root'));
			const mid = new ActiveDagNode('mid', () => exec('mid'));
			const child = new ActiveDagNode('child', () => exec('child'));

			child.registerDependency(mid);
			child.registerDependency(root);
			mid.registerDependency(root);

			vi.useFakeTimers();
			root.trigger();
			await vi.advanceTimersToNextTimerAsync();

			expect(exec).toHaveBeenCalledTimes(2);
			expect(exec).toHaveBeenNthCalledWith(1, 'mid');
			expect(exec).toHaveBeenNthCalledWith(2, 'child');
		});

		it.skip('should execute each node as little as possible, at most once per trigger when triggered multiple times', async () => {
			// This test handles long-running queries, not rapid user interactions
			const exec = vi.fn(() => 'Some truth');

			const root = new ActiveDagNode('root', () => exec('root'));
			const mid = new ActiveDagNode('mid', async (id) => {
				await new Promise((res) => setTimeout(res, 1000));
				return exec('mid', id);
			});
			const child = new ActiveDagNode('child', (id) => exec('child', id));

			// Register dependencies
			child.registerDependency(mid);
			child.registerDependency(root);
			mid.registerDependency(root);

			vi.useFakeTimers();

			const settled = [];
			settled.push(root.trigger());
			await vi.advanceTimersByTimeAsync(500);
			settled.push(root.trigger());
			await vi.runAllTimersAsync();

			const [first, second] = await Promise.all(settled);
			expect(exec).toHaveBeenCalledTimes(3);
			expect(exec).toHaveBeenNthCalledWith(1, 'mid', first);
			expect(exec).toHaveBeenNthCalledWith(2, 'mid', second);
			expect(exec).toHaveBeenNthCalledWith(3, 'child', second);

			vi.useRealTimers();
		});

		it('should handle complex graphs with active and passive nodes', async () => {
			const exec = vi.fn(() => true);
			const statesQuery = new ActiveDagNode('states', () => exec('states'));
			const localesQuery = new ActiveDagNode('locales', () => exec('locales'));
			const ordersQuery = new ActiveDagNode('orders', () => exec('orders'));

			const selectedState = new PassiveDagNode('selectedState');
			const selectedLocale = new PassiveDagNode('selectedLocale');

			selectedState.registerDependency(statesQuery);

			selectedLocale.registerDependency(localesQuery);

			localesQuery.registerDependency(selectedState);

			ordersQuery.registerDependency(selectedLocale);
			ordersQuery.registerDependency(selectedState);

			vi.useFakeTimers();
			selectedState.trigger();
			await vi.advanceTimersToNextTimerAsync();

			expect(exec).toHaveBeenCalledTimes(2);
			expect(exec).toHaveBeenNthCalledWith(1, 'locales');
			expect(exec).toHaveBeenNthCalledWith(2, 'orders');
		});
	});

	describe('Circular Dependencies', () => {
		it('should not allow direct circular dependencies', () => {
			const parent = new DagNode('parent');
			const child = new DagNode('child');

			child.registerDependency(parent);
			expect(() => parent.registerDependency(child)).toThrow();
		});
		it('should not allow deep circular dependencies', () => {
			const parent = new DagNode('parent');
			const middle = new DagNode('middle');
			const child = new DagNode('child');

			middle.registerDependency(parent);
			child.registerDependency(middle);
			expect(() => parent.registerDependency(child)).toThrow();
		});
	});

	describe('Deferal', () => {
		it('should call registered deferrals when execution completes', async () => {
			const fn = vi.fn();
			const dagNode = new ActiveDagNode('test', (_, register) => {
				register(fn);
				return true;
			});
			vi.useFakeTimers();

			dagNode.trigger(true);
			await vi.advanceTimersToNextTimerAsync();
			expect(fn).toHaveBeenCalledTimes(1);
		});
		it('should call registered deferrals when execution of other nodes completes', async () => {
			const fn = vi.fn();

			const dagNode = new ActiveDagNode('test', (_, register) => {
				register(() => fn('deferred'));
				fn('non-deferred (parent)');
				return true;
			});
			const childNode = new ActiveDagNode('child', () => {
				console.log('Executing child');
				fn('non-deferred (child)');
				return true;
			});
			vi.useFakeTimers();
			childNode.registerDependency(dagNode);
			dagNode.trigger(true);
			await vi.advanceTimersToNextTimerAsync();
			console.log(fn.mock.calls);
			expect(fn).toHaveBeenCalledTimes(3);
			expect(fn).toHaveBeenNthCalledWith(1, 'non-deferred (parent)');
			expect(fn).toHaveBeenNthCalledWith(2, 'non-deferred (child)');
			expect(fn).toHaveBeenNthCalledWith(3, 'deferred');
		});
	});
});
