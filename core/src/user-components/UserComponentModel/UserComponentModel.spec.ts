import { describe, expect, it } from 'vitest';
import { UserComponentModel, type WithDefaults, type UserComponentModelInit } from '.';
import type { QueryDependencies } from '../../Query.svelte';

const deps = {} as unknown as QueryDependencies;

describe('UserComponentModel', () => {
	describe('constructor', () => {
		it('accepts parent=null when options.parentRequired=undefined', () => {
			class MyModel extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}

			expect(
				() => new MyModel({ attributes: {}, validationErrors: [], parent: null, deps })
			).not.toThrow();
		});

		it('accepts parent=null when options.parentRequired=false', () => {
			class MyModel extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, { parentRequired: false });
				}
			}

			expect(
				() => new MyModel({ attributes: {}, validationErrors: [], parent: null, deps })
			).not.toThrow();
		});

		it('throws when parent=null when options.parentRequired=true', () => {
			type MyModelGenerics = { ParentRequired: true };
			class MyModel extends UserComponentModel<MyModelGenerics> {
				constructor(init: UserComponentModelInit<MyModelGenerics>) {
					super(init, { parentRequired: true });
				}
			}

			expect(
				// @ts-expect-error This has a type error, which is expected
				() => new MyModel({ attributes: {}, validationErrors: [], parent: null, deps })
			).toThrow();
		});

		it('accepts any type of parent when options.validParentClasses is undefined', () => {
			class MyParent extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}
			const parent = new MyParent({ attributes: {}, validationErrors: [], parent: null, deps });

			class MyModel extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, { validParentClasses: undefined });
				}
			}

			expect(
				() => new MyModel({ attributes: {}, validationErrors: [], parent, deps })
			).not.toThrow();
		});

		it('throws when parent!=null when options.validParentClasses is empty', () => {
			class MyParent extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}
			const parent = new MyParent({ attributes: {}, validationErrors: [], parent: null, deps });

			type MyModelGenerics = WithDefaults<{ ValidParents: [] }>;
			class MyModel extends UserComponentModel<MyModelGenerics> {
				constructor(init: UserComponentModelInit<MyModelGenerics>) {
					super(init, { validParentClasses: [] });
				}
			}

			// @ts-expect-error This has a type error, which is expected
			expect(() => new MyModel({ attributes: {}, validationErrors: [], parent, deps })).toThrow();
		});

		it('accepts any type of parent when options.validParentClasses is undefined', () => {
			class MyParent extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}
			const parent = new MyParent({ attributes: {}, validationErrors: [], parent: null, deps });

			class MyModel extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, { validParentClasses: undefined });
				}
			}

			expect(
				() => new MyModel({ attributes: {}, validationErrors: [], parent, deps })
			).not.toThrow();
		});

		it('accepts parent when it is in options.validParentClasses', () => {
			class MyParent extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}
			const parent = new MyParent({ attributes: {}, validationErrors: [], parent: null, deps });

			class MyModel extends UserComponentModel<WithDefaults<{ ValidParents: [typeof MyParent] }>> {
				constructor(
					init: UserComponentModelInit<WithDefaults<{ ValidParents: [typeof MyParent] }>>
				) {
					super(init, { validParentClasses: [MyParent] });
				}
			}

			expect(
				() => new MyModel({ attributes: {}, validationErrors: [], parent, deps })
			).not.toThrow();
		});

		it('throws when parent is not in options.validParentClasses', () => {
			type ValidParentGenerics = WithDefaults<{ Attributes: { a: string } }>;
			class ValidParent extends UserComponentModel<ValidParentGenerics> {
				constructor(init: UserComponentModelInit<ValidParentGenerics>) {
					super(init, {});
				}
			}

			type InvalidParentGenerics = WithDefaults<{ Attributes: { b: string } }>;
			class InvalidParent extends UserComponentModel<InvalidParentGenerics> {
				constructor(init: UserComponentModelInit<InvalidParentGenerics>) {
					super(init, {});
				}
			}
			const invalidParent = new InvalidParent({
				attributes: { b: '' },
				validationErrors: [],
				parent: null,
				deps
			});

			type MyModelGenerics = WithDefaults<{ ValidParents: [typeof ValidParent] }>;
			class MyModel extends UserComponentModel<MyModelGenerics> {
				constructor(init: UserComponentModelInit<MyModelGenerics>) {
					super(init, { validParentClasses: [ValidParent] });
				}
			}

			expect(
				// @ts-expect-error This has a type error, which is expected
				() => new MyModel({ attributes: {}, validationErrors: [], parent: invalidParent, deps })
			).toThrow();
		});
	});

	describe('addChild', () => {
		it('accepts any type of child when options.validChildClasses is undefined', () => {
			class MyChild extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}

			class MyModel extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, { validChildClasses: undefined });
				}
			}

			const model = new MyModel({ attributes: {}, validationErrors: [], parent: null, deps });
			const child = new MyChild({ attributes: {}, validationErrors: [], parent: model, deps });

			expect(() => model.addChild(child)).not.toThrow();
		});

		it('accepts parent when it is in options.validChildClasses', () => {
			class MyChild extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}

			type MyModelGenerics = WithDefaults<{ ValidChildren: [typeof MyChild] }>;
			class MyModel extends UserComponentModel<MyModelGenerics> {
				constructor(init: UserComponentModelInit<MyModelGenerics>) {
					super(init, { validChildClasses: [MyChild] });
				}
			}

			const model = new MyModel({ attributes: {}, validationErrors: [], parent: null, deps });
			const child = new MyChild({ attributes: {}, validationErrors: [], parent: model, deps });

			expect(() => model.addChild(child)).not.toThrow();
		});

		it('throws when options.validChildClasses is empty', () => {
			class MyChild extends UserComponentModel {
				constructor(init: UserComponentModelInit) {
					super(init, {});
				}
			}

			type MyModelGenerics = WithDefaults<{ ValidChildren: [] }>;
			class MyModel extends UserComponentModel<MyModelGenerics> {
				constructor(init: UserComponentModelInit<MyModelGenerics>) {
					super(init, { validChildClasses: [] });
				}
			}

			const model = new MyModel({ attributes: {}, validationErrors: [], parent: null, deps });
			const child = new MyChild({ attributes: {}, validationErrors: [], parent: model, deps });

			// @ts-expect-error This has a type error, which is expected
			expect(() => model.addChild(child)).toThrow();
		});

		it('throws when parent is not in options.validChildClasses', () => {
			type ValidChildGenerics = WithDefaults<{ Attributes: { a: string } }>;
			class ValidChild extends UserComponentModel<ValidChildGenerics> {
				constructor(init: UserComponentModelInit<ValidChildGenerics>) {
					super(init, {});
				}
			}

			type InvalidChildGenerics = WithDefaults<{ Attributes: { b: string } }>;
			class InvalidChild extends UserComponentModel<InvalidChildGenerics> {
				constructor(init: UserComponentModelInit<InvalidChildGenerics>) {
					super(init, {});
				}
			}

			type MyModelGenerics = WithDefaults<{ ValidChildren: [typeof ValidChild] }>;
			class MyModel extends UserComponentModel<MyModelGenerics> {
				constructor(init: UserComponentModelInit<MyModelGenerics>) {
					super(init, { validChildClasses: [ValidChild] });
				}
			}

			const model = new MyModel({ attributes: {}, validationErrors: [], parent: null, deps });
			const invalidChild = new InvalidChild({
				attributes: { b: '' },
				validationErrors: [],
				parent: model,
				deps
			});

			// @ts-expect-error This has a type error, which is expected
			expect(() => model.addChild(invalidChild)).toThrow();
		});
	});
});
