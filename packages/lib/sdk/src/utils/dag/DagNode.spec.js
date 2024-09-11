import { describe, expect, it, vi } from 'vitest';

import { ActiveNode, Node, PassiveNode, nodesToMermaid } from './node.js';
const noop = () => {};

describe('Node', () => {
	it('should be a function', () => {
		expect(typeof Node).toBe('function');
	});

	it('should be dirty and clean', async () => {
		const node = new ActiveNode('name', noop);
		expect(node.dirty).toBe(false);
		node.markDirty();
		expect(node.dirty).toBe(true);
		await node.flush();
		expect(node.dirty).toBe(false);
	});

	it('should not allow circular dependencies', () => {
		const parent = new Node('parent');
		const child = new Node('child');

		child.registerDependency(parent);
		expect(() => parent.registerDependency(child)).toThrow();
	});
	it('should not allow deep circular dependencies', () => {
		const parent = new Node('parent');
		const middle = new Node('middle');
		const child = new Node('child');

		middle.registerDependency(parent);
		child.registerDependency(middle);
		expect(() => parent.registerDependency(child)).toThrow();
	});

	it('should pass dirty to children', () => {
		const parent = new ActiveNode('parent', noop);
		const child = new ActiveNode('child', noop);

		child.registerDependency(parent);

		parent.markChildrenDirty();
		expect(child.dirty).toBe(true);
	});

    // TODO: Test marking active nodes dirty

	it('should handle this fugly case', async () => {
		const exec = vi.fn();

        vi.useFakeTimers()

		const queryOne = new ActiveNode('queryOne', exec);
		
        const slowExec = vi.fn(async () => {
            await new Promise(res => setTimeout(res, 1000));
        })
        const queryTwo = new ActiveNode('queryTwo', slowExec);
		
        const queryThree = new ActiveNode('queryThree', exec);
		const queryFour = new ActiveNode('queryFour', exec);

		const inputOne = new PassiveNode('inputOne');
		const inputTwo = new PassiveNode('inputTwo');
		const inputThree = new PassiveNode('inputThree');

		inputOne.registerDependency(queryOne);
		inputTwo.registerDependency(queryOne);

		queryTwo.registerDependency(inputOne);
		queryTwo.registerDependency(inputThree);

        inputTwo.registerDependency(queryTwo);

        queryThree.registerDependency(inputTwo);
        queryThree.registerDependency(inputThree);

        queryFour.registerDependency(inputOne);
        queryFour.registerDependency(inputTwo);
        queryFour.registerDependency(inputThree);

        expect(() => inputThree.registerDependency(queryFour)).toThrow();

        inputThree.markChildrenDirty();
        await inputThree.flush()
        await vi.advanceTimersByTimeAsync(500)
        
        expect(slowExec).toHaveBeenCalledTimes(1)
        expect(exec).toHaveBeenCalledTimes(2)
        await inputThree.flush()
        


		console.log(
			Array.from(
				new Set(
					`
graph TD
${nodesToMermaid([inputOne, inputTwo, inputThree, queryOne, queryTwo, queryThree, queryFour])}
`.split('\n')
				)
			).join('\n')
		);

        vi.useRealTimers()
	});

	it('should track dependencies', async () => {
		const execOrder = [];

		const statesExec = vi.fn(() => execOrder.push('states'));
		const statesQuery = new ActiveNode('states', statesExec);

		const localesExec = vi.fn(() => execOrder.push('locales'));
		const localesQuery = new ActiveNode('locales', localesExec);

		const ordersExec = vi.fn(() => execOrder.push('orders'));
		const ordersQuery = new ActiveNode('orders', ordersExec);

		const selectedState = new PassiveNode('selectedState');
		const selectedLocale = new PassiveNode('selectedLocale');

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

		expect(statesExec).not.toHaveBeenCalled();
		expect(localesExec).toHaveBeenCalledOnce();
		expect(ordersExec).toHaveBeenCalledOnce();
		expect(execOrder).toEqual(['locales', 'orders']);
	});
});
