import { describe, expect, it, vi } from 'vitest';
import { RecursiveProxyPrimitive, MakeDeeplyAccessible } from './RecursiveProxyPrimitive.js';
import { customAlphabet } from 'nanoid';

describe('RecursiveProxyPrimitive', () => {
	class BasicSubclass {
		uuid = customAlphabet('abcd', 4)();
		constructor() {
			return MakeDeeplyAccessible(this, () => new BasicSubclass());
		}
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
				myInputValue.x = 'Primitive Value';
				expect(myInputValue.x).toBe('Primitive Value');
				expect(myInputValue.x).toBeTypeOf('string');
			});

			it('should accept Date values as primitives', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.value = new Date();
				expect(myInputValue.value).toBeInstanceOf(Date);
			});
		});

		describe('Value State', () => {
			it('should know if it has a value', () => {
				const myInputValue = new BasicSubclass();
				expect(myInputValue.zed.Unset).toBe(true);
				myInputValue.zed = 'Primitive Value';
				expect(myInputValue.zed.Unset).toBeFalsy();
			});

			it('should allow falsey values', () => {
				const myInputValue = new BasicSubclass();
				expect(myInputValue.zed.Unset).toBe(true);
				myInputValue.zed = false;
				expect(myInputValue.zed.Unset).toBeFalsy();
				expect(myInputValue.zed).toBe(false);
			});

			it('should allow nested falsey values', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.someProp = false;
				expect(myInputValue.someProp.Unset).toBeFalsy();
				expect(myInputValue.someProp).toBe(false);
			});
		});

		describe('Prototype Passthrough', () => {
			it('should be lowercasable', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = 'Primitive Value';
				expect(myInputValue.x.toString()).toBe('Primitive Value');
				expect(myInputValue.x.toLowerCase()).toBe('primitive value');
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
			it('should shed the object wrapper when setting primitive values', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested = 'Hello World';
				expect(myInputValue.nested).toBe('Hello World');
				expect(myInputValue.nested).not.toBeInstanceOf(BasicSubclass);
			});

			it('should set primitive values deeply', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested.double = 'Hello World';
				expect(myInputValue.nested.double).toBe('Hello World');
				expect(myInputValue.nested.double).not.toBeInstanceOf(BasicSubclass);
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
				expect(myInputValue.outer.inner).toBeInstanceOf(BasicSubclass);
			});
		});

		describe('Object Operations', () => {
			it('should respond to Object.assign properly', () => {
				const myInputValue = new BasicSubclass();
				Object.assign(myInputValue.nested, { a: 1 });
				expect(myInputValue.nested).toBeInstanceOf(BasicSubclass);
				expect(myInputValue.nested.a).toBe(1);
			});
		});

		describe('Array Handling', () => {
			it('should work properly with arrays', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested = [1, 2, 3];
				expect(Array.isArray(myInputValue.nested), 'Internal State is an Array').toBeTruthy();
			});

			it('should wrap objects contained in arrays', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.nested = [1, 2, 3, {}];
				expect(Array.isArray(myInputValue.nested, 'Internal State is an Array')).toBeTruthy();
				expect(myInputValue.nested[3]).toBeInstanceOf(BasicSubclass);
			});

			it('should work properly with arrays when created with Object.assign', () => {
				const myInputValue = new BasicSubclass();
				Object.assign(myInputValue, { nested: [1, 2, 3] });

				expect(Array.isArray(myInputValue.nested), 'Internal State is an Array').toBeTruthy();
			});
		});
	});

	describe('Value Updates', () => {
		describe('Subset Updates', () => {
			it('should remove values when a child is updated with a subset (array)', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = [0, 1];
				myInputValue.x = [0];
				expect(myInputValue.x.toJSON()).toEqual([0]);
			});

			it('should remove values when a child is updated with a subset (object)', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = { x: 1, y: 2 };
				myInputValue.x = { x: 1 };
				expect(myInputValue.x.y).not.toBe(2);
			});
		});

		describe('Empty Collections', () => {
			it('should set and get an empty array', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = [];
				expect(Array.isArray(myInputValue.x)).toBeTruthy();
				expect(myInputValue.x.length).toBe(0);
			});

			it('should set and get an empty object', () => {
				const myInputValue = new BasicSubclass();
				myInputValue.x = {};
				expect(myInputValue.x.toJSON()).toEqual({});
			});
		});
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
