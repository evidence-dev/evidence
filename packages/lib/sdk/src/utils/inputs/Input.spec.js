import { Input } from './Input.js';
import { InputValue, ToMarkdown } from './InputValue.js';
import { DagNode } from '../dag/DagNode.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Input & InputValue', () => {
	beforeEach(() => {
		Input.DefaultValueText = '';
		Input.DefaultLabelText = '';
	});
	describe('Initialization', () => {
		it('should be created with a dag node', () => {
			const input = new Input('MockInput');
			expect(DagNode.isDagNode(input.__dag)).toBe(true);
		});
		it('should be initialized with defaultStringify set properly', () => {
			Input.DefaultValueText = 'Hi';
			const inputValue = new InputValue();
			expect(inputValue.defaultStringify).toEqual(Input.DefaultValueText);
		});
	});

	describe('Property Access', () => {
		it('should allow deep access to unset properties', () => {
			const input = new Input('MockInput');
			expect(input.x.y.z).toBeDefined();
			expect(input.x.y.z).toBeInstanceOf(InputValue);
		});
	});

	describe('String Conversion', () => {
		it('should default to the sqlFragmentFactory when markdown escaping', () => {
			const input = new Input('MockInput', { sqlFragmentFactory: () => 'boo!' });
			expect(`${input}`).toBe('boo!');
			expect(input.toString()).toBeTypeOf('string');
		});
		it.only('should allow access to string prototype functions', () => {
			const input = new Input('MockInput', { sqlFragmentFactory: (s) => {
				console.log("|", s.innerValue)
				return s.innerValue
			} });
			expect(input.toUpperCase).toBeDefined();
			expect(input.toUpperCase).toBeTypeOf('function');
			input.innerValue = "Hi";
			console.log("<<<", input.innerValue)
			console.log(">>>>", input.toString())
			expect(input.toUpperCase()).toBe('HI');
		});
		it('should apply string prototype functions based on its toString', () => {
			const input = new Input('MockInput', { sqlFragmentFactory: () => 'boo!' });
			expect(input.toUpperCase()).toBe('BOO!');
		});

		it('should never return undefined for a label', () => {
			const input = new Input('MockInput');
			expect(input.label).toBeDefined();
			expect(input.label).toBeInstanceOf(InputValue);
			console.log(input.get("label"))
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
		it('should work in a simple dropdown-esque case', () => {
			const input = new Input('MockDropdown', { sqlFragmentFactory: () => 'Hi' });
			Object.assign(input, { rawValues: [] });

			// uses the sqlFragmentFactory
			expect(input.toString()).toBe('Hi');
			expect(`${input.label}`).toBe('');
			expect(`${input.value}`).toBe('');
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
	});

	describe('DAG Node Triggering', () => {
		it('should trigger the dag node when a property is set', () => {
			const input = new Input('MockInput');
			vi.spyOn(input.__dag, 'trigger');
			input.x = 1;
			expect(input.__dag.trigger).toHaveBeenCalledTimes(1);
		});
		it('should trigger the dag node when a value is set', () => {
			const input = new Input('MockInput');
			vi.spyOn(input.__dag, 'trigger');
			input.setValue(5);
			expect(input.__dag.trigger).toHaveBeenCalledTimes(1);
			expect(input.toString()).toEqual('5');
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

	describe('Markdown Escapes', () => {
		it('should be falsey when there is no fragment factory and no value', () => {
			const input = new Input('MockInput');
			expect(input).toBeFalsy();
		});
		it('should be truthy when there is a fragment factory and no value', () => {
			const input = new Input('MockInput', { sqlFragmentFactory: () => 'boo!' });
			expect(input).toBeTruthy();
		});
		it('should be truthy when there is no fragment factory and a value', () => {
			const input = new Input('MockInput');
			input.setValue(5);
			expect(input).toBeTruthy();
		});
		it('should be falsy when it has no value and no children', () => {
			const myInputValue = new Input('MockInput');
			expect(myInputValue).toBeFalsy();
		});
		it('should be truthy when it has a value and no children', () => {
			const myInputValue = new Input('MockInput');
			myInputValue.setValue('Primitive Value');
			expect(myInputValue).toBeTruthy();
		});
		it('should be truthy when it has no value and children', () => {
			const myInputValue = new Input('MockInput');
			myInputValue.x = 1;
			expect(myInputValue).toBeTruthy();
		});
		it('should be truthy when it has both value and children', () => {
			const myInputValue = new Input('MockInput');
			myInputValue.setValue('Primitive Value');
			myInputValue.x = 1;
			expect(myInputValue).toBeTruthy();
		});

		it('should retain its type (numeric)', () => {
			const myInputValue = new Input('MockInput');
			myInputValue.setValue(1);
			expect(myInputValue).toBe(1);
		});
		it('should retain its type (boolean)', () => {
			const myInputValue = new Input('MockInput');
			myInputValue.setValue(false);
			expect(myInputValue).toBe(false);
		});
		it('should retain its type (Date)', () => {
			const myInputValue = new Input('MockInput');
			myInputValue.setValue(new Date());
			expect(myInputValue).toBeInstanceOf(Date);
		});

		it('should ternary correctly', () => {
			const input = new Input('MockInput');
			Input.DefaultValueText = '(SELECT NULL WHERE 0 /* Oopsie! */)';
			expect(`${input.value}`).toBe(Input.DefaultValueText);
			input.value = true;
			expect(`${input.value ? 'foo' : 'bar'}`).toBe('foo');
			input.value = false;
			expect(`${input.value ? 'foo' : 'bar'}`).toBe('bar');
		});
	});
});
