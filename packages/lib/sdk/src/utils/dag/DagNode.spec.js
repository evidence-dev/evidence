import { describe, expect, it, vi } from 'vitest';

import { ActiveDagNode, DagNode, PassiveDagNode, nodesToMermaid } from './DagNode.js';
const noop = () => {};

describe('Node', () => {
	it('should be a function', () => {
		expect(typeof DagNode).toBe('function');
	});

	it('should be dirty and clean', async () => {
		const node = new ActiveDagNode('name', noop);
		expect(node.dirty).toBe(false);
		node.markDirty();
		expect(node.dirty).toBe(true);
		await node.flush();
		expect(node.dirty).toBe(false);
	});

	it('should not allow circular dependencies', () => {
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

	it('should pass dirty to children', () => {
		const parent = new ActiveDagNode('parent', noop);
		const child = new ActiveDagNode('child', noop);

		child.registerDependency(parent);

		parent.markChildrenDirty();
		expect(child.dirty).toBe(true);
	});

	it('should flush and run exec functions at most once', async () => {
		const exec = vi.fn();

		const root = new ActiveDagNode('root', () => exec('root'));
		const mid = new ActiveDagNode('mid', () => exec('mid'));
		const child = new ActiveDagNode('child', () => exec('child'));

		child.registerDependency(mid);
		child.registerDependency(root);
		mid.registerDependency(root);

		root.markChildrenDirty();
		expect(child.dirty).toBe(true);
		expect(mid.dirty).toBe(true);

		await root.flush();
        console.log(exec.mock.calls)

		expect(exec).toHaveBeenCalledTimes(2);
		expect(exec).toHaveBeenNthCalledWith(1, 'mid');
		expect(exec).toHaveBeenNthCalledWith(2, 'child');
	});

	it('should handle duplicate runs', async () => {
		const exec = vi.fn();

		const root = new ActiveDagNode('root', () => exec('root'));
		const mid = new ActiveDagNode('mid', async () => {
            await new Promise((res) => setTimeout(res, 1000));
			exec('mid');
		});
		const child = new ActiveDagNode('child', () => exec('child'));

		// Register dependencies
		child.registerDependency(mid);
		child.registerDependency(root);
		mid.registerDependency(root);

        vi.useFakeTimers()
		// Name these functions so we can see what's going on
		const updateRoot = () => {
			console.log('<-- updateRoot -->');

			return root.flush();
		};

		const firstUpdate = updateRoot();
        await vi.advanceTimersByTimeAsync(500);
        
        const secondUpdate = updateRoot();
        await vi.advanceTimersByTimeAsync(1000);

		expect(exec).toHaveBeenCalledTimes(3);
		expect(exec).toHaveBeenNthCalledWith(1, 'mid');
		expect(exec).toHaveBeenNthCalledWith(2, 'mid');
		expect(exec).toHaveBeenNthCalledWith(3, 'child');
	});

	// TODO: Test marking active nodes dirty
    // TODO: Clean up epoch behavior - the thought is there but it needs refining

	it('should track dependencies', async () => {
		

		const exec = vi.fn();
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

		selectedState.markChildrenDirty(); // user made a selection
		expect(selectedLocale.dirty).toBe(true);
		expect(localesQuery.dirty).toBe(true);
		expect(ordersQuery.dirty).toBe(true);

		await selectedState.flush();

        console.log(exec.mock.calls)
		expect(exec).toHaveBeenCalledTimes(2);
        expect(exec).toHaveBeenNthCalledWith(1, 'locales');
        expect(exec).toHaveBeenNthCalledWith(2, 'orders');
		// expect(localesExec).toHaveBeenCalledOnce();
		// expect(ordersExec).toHaveBeenCalledOnce();
		// expect(execOrder).toEqual(['locales', 'orders']);
	});
});
