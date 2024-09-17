import { Input } from './Input.js';
import { InputValue } from './InputValue.js';
import { DagNode } from '../dag/DagNode.js';
import { describe, expect, it, vi } from 'vitest';

describe('Input & InputValue', () => {
	// TODO: Test both blocking & passive
	it('should be created with a dag node', () => {
		const input = new Input('MockInput');
		expect(DagNode.isDagNode(input.__dag)).toBe(true);
	});

	it('should allow deep access to unset properties', () => {
		const input = new Input('MockInput');
		expect(input.x.y.z).toBeDefined();
		expect(input.x.y.z).toBeInstanceOf(InputValue);
	});

	it('should trigger the dag node when a property is set', () => {
		const input = new Input('MockInput');
		vi.spyOn(input.__dag, 'trigger');
		input.x = 1;
		expect(input.__dag.trigger).toHaveBeenCalledTimes(1);
	});

	it('should trigger the dag node when a deep property is set', () => {
		const input = new Input('MockInput');
		vi.spyOn(input.__dag, 'trigger');
		input.x.y = 1;
		expect(input.__dag.trigger).toHaveBeenCalledTimes(1);
	});

	it('should know when it has been modified', () => {
		const input = new Input('MockInput');
		expect(input.hasValue).toBe(false);
		input.x = 1;
		expect(input.hasValue).toBe(true);
	});

	it('should know when it has been deeply modified', () => {
		const input = new Input('MockInput');
		expect(input.hasValue).toBe(false);
		input.x.y = 1;
		expect(input.hasValue).toBe(true);
	});

	it('should stringify to an empty string without a value', () => {
		const input = new Input('MockInput');
		expect(`${input}`).toBe('');
	});

	it('should accept a sqlFragmentFactory to override toString behavior', () => {
		const input = new Input('MockInput', {
			sqlFragmentFactory: (input) => {
				console.log(input, input.madeUp);
				return `${input.madeUp}`;
			}
		});
		input.madeUp = 5;
		expect(`${input}`).toBe('5');
	});
});
