import { Input } from './Input.js';
import { InputValue } from './InputValue.js';
import { DagNode } from '../dag/DagNode.js';
import { describe, expect, it, vi } from 'vitest';

describe('Input & InputValue', () => {
	describe('Initialization', () => {
		it('should be created with a dag node', () => {
			const input = new Input('MockInput');
			expect(DagNode.isDagNode(input.__dag)).toBe(true);
		});
	});

	describe('Property Access', () => {
		it('should allow deep access to unset properties', () => {
			const input = new Input('MockInput');
			expect(input.x.y.z).toBeDefined();
			expect(input.x.y.z).toBeInstanceOf(InputValue);
		});
	});

	describe('DAG Node Triggering', () => {
		it('should trigger the dag node when a property is set', () => {
			const input = new Input('MockInput');
			vi.spyOn(input.__dag, 'trigger');
			input.x = 1;
			expect(input.__dag.trigger).toHaveBeenCalledTimes(1);
		});
		it.only('should trigger the dag node when a value is set', () => {
			const input = new Input('MockInput');
			vi.spyOn(input.__dag, 'trigger');
			input.setValue(5);
			expect(input.__dag.trigger).toHaveBeenCalledTimes(1);
			expect(input.toString()).toEqual("5")
		});

		it('should trigger the dag node when a deep property is set', () => {
			const input = new Input('MockInput');
			vi.spyOn(input.__dag, 'trigger');
			input.x.y = 1;
			expect(input.__dag.trigger).toHaveBeenCalledTimes(1);
		});
	});

	describe('Value State', () => {
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
	});

	describe('String Conversion', () => {
		/*
			input.myDropdown
			input.myDropdown.label
			input.myDropdown.value
		*/
		it('should never return undefined for a label', () => {
			const input = new Input('MockInput');
			expect(input.label).toBeDefined();
			expect(input.label).toBeInstanceOf(InputValue);
			expect(input.get('label')).toBe(Input.DefaultLabelText);
		});

		it('should stringify to an empty string without a value', () => {
			const input = new Input('MockInput');
			expect(`${input}`).toBe('');
		});

		it('should not stringify to [object Object]', () => {
			const input = new Input('MockInput');
			Object.assign(input, { someProperty: 'someValue' });
			expect(`${input}`).toBe('{"someProperty":"someValue"}');
		});

		it('should accept a sqlFragmentFactory to override default toString behavior', () => {
			const input = new Input('MockInput', {
				sqlFragmentFactory: (input) => {
					return `${input.madeUp}`;
				}
			});
			input.madeUp = 5;
			expect(`${input}`).toBe('5');
		});
		it('should not apply a sqlFragmentFactory to child values', () => {
			const input = new Input('MockInput', {
				sqlFragmentFactory: () => {
					return `10`;
				}
			});
			input.madeUp = 5;
			expect(`${input.madeUp}`).toBe('5');
		});
		it('should behave the way I want it to', () => {
			const input = new Input('MockDropdown', { sqlFragmentFactory: () => 'Hi' });
			Object.assign(input, { rawValues: [] });

			// uses the sqlFragmentFactory
			expect(input.toString()).toBe('Hi');
			expect(`${input.label}`).toBe('');
			expect(`${input.value}`).toBe('');
		});
	});
});
