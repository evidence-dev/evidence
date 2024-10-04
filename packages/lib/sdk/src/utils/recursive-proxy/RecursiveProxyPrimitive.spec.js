import { describe, expect, it, vi } from 'vitest';
import {
	RecursiveProxyPrimitive,
	PrimitiveValue,
	InternalState,
	MarkdownEscape
} from './RecursiveProxyPrimitive.js';
import { customAlphabet } from 'nanoid';

describe('RecursiveProxyPrimitive', () => {
	class BasicSubclass extends RecursiveProxyPrimitive {
		uuid = customAlphabet('abcd', 4)();
	}

	describe('Class Behavior', () => {
		it('should behave as an abstract class', () => {
			expect(() => new RecursiveProxyPrimitive()).toThrow();
		});
	});

	describe('Primitive Values', () => {
		describe('Setting and Getting', () => {
			it('should allow a primitive value', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue('Primitive Value');
				// myInputValue.value = 'Primitive Value';
				expect(`${myInputValue}`).toBe('Primitive Value');
				// expect(`${myInputValue.value}`).toBe('Primitive Value');
			});

			it('should throw when given a non-primitive value', () => {
				const myInputValue = new BasicSubclass();
				expect(() => myInputValue.setValue({})).toThrow();
			});

			it('should accept Date values', () => {
				const myInputValue = new BasicSubclass();
				expect(() => myInputValue.setValue(new Date())).not.toThrow();
			});
		});

		describe('Value State', () => {
			it('should know if it has a value', () => {
				const myInputValue = new BasicSubclass();
				expect(myInputValue.hasValue).toBe(false);
				myInputValue.setValue('Primitive Value');
				expect(myInputValue.hasValue).toBe(true);
			});

			it('should allow falsey values', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue(false);
				expect(myInputValue.hasValue).toBe(true);
				expect(myInputValue[PrimitiveValue]).toBe(false);
			});

			it('should allow nested falsey values', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.someProp = false;
				expect(myInputValue.someProp.hasValue).toBe(true);
				expect(myInputValue.someProp[PrimitiveValue]).toBe(false);
			});
		});

		describe('Value Operations', () => {
			it('should allow assignment of one value to another', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.a = undefined;
				myInputValue.b = myInputValue.a;
				myInputValue.b = 'Hi!';
				myInputValue.a = 'Hi!';

				expect(myInputValue.a[PrimitiveValue]).toBe('Hi!');
				expect(myInputValue.b[PrimitiveValue]).toBe('Hi!');
			});

			it('should stringify to its direct value', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue('Primitive Value');
				expect(myInputValue.toString()).toBe('Primitive Value');
			});
		});

		describe('Markdown Escape', () => {
			it('should be falsy when it has no value and no children', () => {
				const myInputValue = new BasicSubclass();
				expect(myInputValue[MarkdownEscape]).toBeFalsy();
			});
			it('should be truthy when it has a value and no children', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue('Primitive Value');
				expect(myInputValue[MarkdownEscape]).toBeTruthy();
			});
			it('should be truthy when it has no value and children', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = 1;
				expect(myInputValue[MarkdownEscape]).toBeTruthy();
			});
			it('should be truthy when it has both value and children', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue('Primitive Value');
				myInputValue.x = 1;
				expect(myInputValue[MarkdownEscape]).toBeTruthy();
			});

			it('should retain its type (numeric)', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue(1);
				expect(myInputValue[MarkdownEscape]).toBe(1);
			});
			it('should retain its type (boolean)', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue(false);
				expect(myInputValue[MarkdownEscape]).toBe(false);
			});
			it('should retain its type (Date)', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue(new Date());
				expect(myInputValue[MarkdownEscape]).toBeInstanceOf(Date);
			});
		});

		describe('Prototype Passthrough', () => {
			it('should be lowercasable', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.setValue('Primitive Value');
				expect(myInputValue.toString()).toBe('Primitive Value');
				expect(myInputValue.toLowerCase()).toBe('primitive value');
			});
		});
	});

	describe('Recursive Access', () => {
		describe('Unset Values', () => {
			it('should not throw when attempting to access unset values', () => {
				const myInputValue = new BasicSubclass();
				expect(() => myInputValue.value).not.toThrow();
			});

			it('should not throw when attempting to access nested unset values', () => {
				const myInputValue = new BasicSubclass();
				expect(() => myInputValue.some.made.up.path).not.toThrow();
			});
		});

		describe('Setting Values', () => {
			it('should set primitive values', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested = 'Hello World';
				expect(myInputValue.nested.toString()).toBe('Hello World');
				expect(myInputValue.nested).toBeInstanceOf(BasicSubclass);
			});

			it('should set primitive values deeply', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested.double = 'Hello World';
				expect(myInputValue.nested.double.toString()).toBe('Hello World');
				expect(myInputValue.nested.double).toBeInstanceOf(BasicSubclass);
			});

			it('should unpack object values and transform them into proxies individually', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.outer = {
					outerValue: 'Outer',
					inner: {
						innerValue: 'Inner'
					}
				};
				expect(myInputValue.outer.outerValue.toString()).toBe('Outer');
				expect(myInputValue.outer.inner.innerValue.toString()).toBe('Inner');
				expect(myInputValue.outer.inner.innerValue).toBeInstanceOf(BasicSubclass);
			});
		});

		describe('Parent-Child Relationships', () => {
			it('should know about its parents', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested = 'Child';
				myInputValue.setValue('Parent');
				expect(`${myInputValue.nested.parent}`).toBe('{"nested":"Child"}');
				expect(myInputValue.nested.parent).toBe(myInputValue);
			});
		});

		describe('Object Operations', () => {
			it('should respond to Object.assign properly', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested = 'Child';
				myInputValue.setValue('Parent');
				expect(myInputValue.nested.parent).toBe(myInputValue);
				Object.assign(myInputValue.nested, { a: 1 });
				expect(myInputValue.nested.a).toBeInstanceOf(BasicSubclass);
				expect(myInputValue.nested.a[PrimitiveValue]).toBe(1);
			});
		});

		describe('Array Handling', () => {
			it('should work properly with arrays', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested = [1, 2, 3];
				expect(myInputValue.nested[0]).toBeInstanceOf(BasicSubclass);
				expect(
					Array.isArray(myInputValue.nested[InternalState]),
					'Internal State is an Array'
				).toBeTruthy();
			});

			it('should work properly with arrays when created with Object.assign', () => {
				const myInputValue = new BasicSubclass();
				Object.assign(myInputValue, { nested: [1, 2, 3] });
				expect(myInputValue.nested[0]).toBeInstanceOf(BasicSubclass);
				expect(
					Array.isArray(myInputValue.get('nested')),
					'Internal State is an Array'
				).toBeTruthy();
			});
		});
	});

	describe('Value Updates', () => {
		describe('Subset Updates', () => {
			it('should remove values when a child is updated with a subset (array)', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = [0, 1];
				myInputValue.x = [0];
				expect(myInputValue.get('x')).toEqual([0]);
			});

			it('should remove values when a child is updated with a subset (object)', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = { x: 1, y: 2 };
				myInputValue.x = { x: 1 };
				expect(myInputValue.get('x')).toEqual({ x: 1 });
			});
		});

		describe('Empty Collections', () => {
			it('should set and get an empty array', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = [];
				expect(myInputValue.get('x')).toEqual([]);
			});

			it('should set and get an empty object', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = {};
				expect(myInputValue.get('x')).toEqual({});
			});
		});
	});

	describe('JSON and String Conversion', () => {
		/*
			Potential States:
				- Has no value
				- Has a value
				- Has nested values

			Potential Operations:
				- toPrimitive
				- toString
				- toJSON
		*/

		describe('Stringification', () => {
			describe('JSON.stringify', () => {
				it('should return empty string when no value or children are set', () => {
					const myInputValue = new BasicSubclass();
					expect(JSON.stringify(myInputValue)).toBe('{}');
				});
				it('should return the primitive value as a string when value is set and no children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(1);
					expect(JSON.stringify(myInputValue)).toBe('1');
				});
				it('should return the children as a plain JSON string when value is not set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.x = 1;
					expect(JSON.stringify(myInputValue)).toBe('{"x":1}');
				});
				it('should return the children as a plain JSON string when value is set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(10); // This is ignored, because we set `.x`
					myInputValue.x = 1;
					expect(JSON.stringify(myInputValue)).toBe('{"x":1}');
				});
			});
			describe('template strings', () => {
				it('should return empty string when no value or children are set', () => {
					const myInputValue = new BasicSubclass();
					expect(`${myInputValue}`).toBe('');
				});
				it('should return the primitive value as a string when value is set and no children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(1);
					expect(`${myInputValue}`).toBe('1');
				});
				it('should return the children as a plain JSON string when value is not set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.x = 1;
					expect(`${myInputValue}`).toBe('{"x":1}');
				});
				it('should return the children as a plain JSON string when value is set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(10); // This is ignored, because we set `.x`
					myInputValue.x = 1;
					expect(`${myInputValue}`).toBe('{"x":1}');
				});
			});
			describe('type coersion', () => {
				it('should return empty string when no value or children are set', () => {
					const myInputValue = new BasicSubclass();
					expect(myInputValue + '').toBe('');
				});
				it('should return the primitive value as a string when value is set and no children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(1);
					expect(myInputValue + '').toBe('1');
				});
				it('should return the children as a plain JSON string when value is not set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.x = 1;
					expect(myInputValue + '').toBe('{"x":1}');
				});
				it('should return the children as a plain JSON string when value is set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(10); // This is ignored, because we set `.x`
					myInputValue.x = 1;
					expect(myInputValue + '').toBe('{"x":1}');
				});
			});
			describe('toString', () => {
				it('should return empty string when no value or children are set', () => {
					const myInputValue = new BasicSubclass();
					expect(myInputValue.toString()).toBe('');
				});
				it('should return the primitive value as a string when value is set and no children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(1);
					expect(myInputValue.toString()).toBe('1');
				});
				it('should return the children as a plain JSON string when value is not set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.x = 1;
					expect(myInputValue.toString()).toBe('{"x":1}');
				});
				it('should return the children as a plain JSON string when value is set and children are set', () => {
					const myInputValue = new BasicSubclass();
					myInputValue.setValue(10); // This is ignored, because we set `.x`
					myInputValue.x = 1;
					expect(myInputValue.toString()).toBe('{"x":1}');
				});
			});
		});

		// it('should JSON.stringify to an empty string without a value', () => {
		// 	const myInputValue = new BasicSubclass();
		// 	expect(JSON.stringify(myInputValue)).toBe('');
		// });
		// it.each([
		// 	{ label: 'string', value: 'string', output: '"string"' },
		// 	{ label: 'number', value: 1, output: '1' },
		// 	{ label: 'boolean', value: true, output: 'true' }
		// ])('should JSON.stringify to a $label when set with a $label', (args) => {
		// 	const myInputValue = new BasicSubclass();
		// 	myInputValue.setValue(args.value);
		// 	expect(JSON.stringify(myInputValue)).toBe(args.output);
		// });
		// it('should JSON.stringify to an object when child properties are set', () => {
		// 	const myInputValue = new BasicSubclass();
		// 	myInputValue.x.setValue(1);
		// 	expect(JSON.stringify(myInputValue)).toBe('{"x":1}');
		// });
		// it('should JSON.stringify to child properties to arrays', () => {
		// 	const myInputValue = new BasicSubclass();
		// 	myInputValue.x = [1];
		// 	expect(JSON.stringify(myInputValue)).toBe('{"x":[1]}');
		// });
	});

	describe('Dynamic Construction', () => {
		describe('Child Constructor', () => {
			it('should create children using a given constructor', () => {
				class MyClass extends RecursiveProxyPrimitive {
					static __ChildConstructor = MyClass;
				}

				const myInputValue = new MyClass();
				myInputValue.nested = 'Hello World';
				expect(myInputValue.nested.toString()).toBe('Hello World');
				expect(myInputValue.nested).toBeInstanceOf(MyClass);
			});

			it("should disallow children that don't inherit from RecursiveProxyPrimitive", () => {
				class MyClass {}
				expect(() => new RecursiveProxyPrimitive(MyClass)).toThrow();
			});
		});

		describe('Subclass Behavior', () => {
			it('should function as expected when using a constructor', () => {
				class MyClass extends RecursiveProxyPrimitive {}

				const myInputValue = new MyClass();
				myInputValue.nested = 'Hello World';
				expect(myInputValue.nested.toString()).toBe('Hello World');
				expect(myInputValue.nested).toBeInstanceOf(MyClass);
				myInputValue.someObj = { a: 1 };
				expect(myInputValue.someObj.a).toBeInstanceOf(MyClass);
				expect(`${myInputValue.someObj.a}`).toEqual('1');
			});

			it('should respect toString overrides', () => {
				class MyClass extends RecursiveProxyPrimitive {
					toString = () => {
						return 'Hello World';
					};
				}
				expect(new MyClass().toString()).toBe('Hello World');
				expect(`${new MyClass()}`).toBe('Hello World');
				expect(new MyClass() + '').toBe('Hello World');
				// JSON.stringify does not go straight to toString, and should not reflect the override
				expect(JSON.stringify(new MyClass())).toBe('{}');
			});

			it('should allow subclasses to statically define a child constructor', () => {
				class MyClass extends RecursiveProxyPrimitive {
					static ChildConstructor = MyClass;
				}
				expect(MyClass.ChildConstructor).toBe(MyClass);
			});

			it('should respect defined properties of subclasses', () => {
				class MyClass extends RecursiveProxyPrimitive {
					myProp;
					constructor() {
						super();
						this.myProp = 5;
					}
				}

				expect(() => new MyClass()).not.toThrow();
				const instance = new MyClass();
				expect(instance.myProp).toBe(5);
			});
		});
	});

	describe('Hooks', () => {
		describe('Set Hooks', () => {
			it('should call pre set hooks with unwrapped values', () => {
				const fn = vi.fn();
				class MyClass extends RecursiveProxyPrimitive {
					constructor() {
						super({ hooks: { set: { pre: fn } } });
					}
				}
				const x = new MyClass();
				x.y = 1;
				expect(fn).toHaveBeenCalledOnce();
				expect(fn).toHaveBeenCalledWith('y', 1, x);
			});

			it('should call post set hooks with wrapped values', () => {
				const fn = vi.fn();
				class MyClass extends RecursiveProxyPrimitive {
					constructor() {
						super({ hooks: { set: { post: fn } } });
					}
				}
				const x = new MyClass();
				x.y = 1;
				expect(fn).toHaveBeenCalledOnce();
				// Reference the call directly because we don't have a good way to do that with vitest
				expect(fn.mock.calls[0][1]).toBeInstanceOf(MyClass);
				expect(`${fn.mock.calls[0][1]}`).toBe('1');
			});
		});

		describe('Hook Inheritance', () => {
			it('should not pass pre hooks to children when inheritPre is falsey', () => {
				const fn = vi.fn();
				class MyClass extends RecursiveProxyPrimitive {
					constructor(...args) {
						super(...args);
					}
				}
				const x = new MyClass({ hooks: { set: { pre: fn, inheritPre: false } } });
				x.y.z = 1;
				expect(fn).not.toHaveBeenCalled();
			});

			it('should pass pre hooks to children when inheritPre is set', () => {
				const fn = vi.fn();
				class MyClass extends RecursiveProxyPrimitive {
					id = Math.random().toString().slice(-3);
				}
				const x = new MyClass({ hooks: { set: { pre: fn, inheritPre: true } } });
				x.y.z = 1;
				expect(fn).toHaveBeenCalledOnce();
				expect(fn).toHaveBeenCalledWith('z', 1, x.y);
			});
		});
	});
});
