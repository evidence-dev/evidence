import { Input } from './Input.js';
import { DagNode } from '../dag/DagNode.js';
import { describe, expect, it, vi } from 'vitest';

describe('Input & InputValue', () => {
	it('should be created with a dag node', () => {
		const input = new Input('MockInput');
		expect(DagNode.isDagNode(input.__dag)).toBe(true);
	});

	it('should allow deep access to unset properties', () => {
		const input = new Input('MockInput');
		expect(input.x.y.z).toBeDefined();
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
		expect(input.isSet).toBe(false);
		input.x = 1;
		expect(input.isSet).toBe(true);
	});

	it('should know when it has been deeply modified', () => {
		const input = new Input('MockInput');
		expect(input.isSet).toBe(false);
		input.x.y = 1;
		expect(input.isSet).toBe(true);
	});

	it('should stringify to an empty string without a value', () => {
		const input = new Input('MockInput');
		expect(`${input}`).toBe('');
	});
	it('should stringify to an empty string without a value', () => {
		const input = new Input('MockInput');
		expect(`${input.value}`).toBe('');
	});
});
