import type { MaybeGetter } from 'runed';
import type { UserComponentModel } from './UserComponentModel.svelte';
import type { QueryDependencies } from '../../Query.svelte';
import type { MetricsCatalog } from '../../metrics/metrics-catalog';
import type { ValidateError } from '@markdoc/markdoc';

/** Helper type to represent a class constructor type */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConstructor = abstract new (...args: any) => any;

/**
 * Helper type to determine the type of classes in an array
 * If Classes is undefined -> Base
 * If Classes has at least one element -> type of Classes elements
 * If classes is empty -> never
 */
type InstanceOf<
	Base extends AnyConstructor,
	Classes extends Base[] | undefined
> = undefined extends Classes
	? InstanceType<Base>
	: Classes extends readonly [infer _, ...infer _Rest]
		? InstanceType<Classes[number]>
		: never;

/** The generic types that define a UserComponentModel, organized as an object rather than positional args for clarity */
export type GenericsShape = {
	Attributes?: Record<string, unknown>;
	Serialized?: unknown;
	ParentRequired?: boolean | undefined;
	ValidParents?: UserComponentModelClass[] | undefined;
	ValidChildren?: UserComponentModelClass[] | undefined;
};

/** Default values for GenericsShape */
export type GenericsDefaults = {
	Attributes: Record<string, unknown>;
	Serialized: undefined;
	ParentRequired: false;
	ValidParents: undefined;
	ValidChildren: undefined;
};

/**
 * Helper type to specify only some of the UserComponentModel generics while leaving the rest undefined
 *
 * @example
 * type MyType = WithDefaults<{
 *   Attributes: { myKey: string }
 *   ParentRequired: true
 * }>
 * // Attributes: { myKey: string }
 * // Serialized: undefined;
 * // ParentRequired: true
 * // ValidParents: undefined;
 * // ValidChildren: undefined;
 */
export type WithDefaults<T extends GenericsShape> = Omit<GenericsDefaults, keyof T> & T;

/** Computes the type of a UserComponentModel's Parent based on the ParentRequired and ValidParents generics */
export type Parent<
	T extends Pick<GenericsShape, 'ParentRequired' | 'ValidParents'> = GenericsDefaults
> = T['ParentRequired'] extends true
	? InstanceOf<UserComponentModelClass, T['ValidParents']>
	: InstanceOf<UserComponentModelClass, T['ValidParents']> | null;

/** Computes the type of a UserComponentModel's Children based on the ValidChildren generics */
export type Child<T extends Pick<GenericsShape, 'ValidChildren'> = GenericsDefaults> = InstanceOf<
	UserComponentModelClass,
	T['ValidChildren']
>;

export type UserComponentModelOptions<
	T extends Pick<GenericsShape, 'ParentRequired' | 'ValidParents' | 'ValidChildren'>
> = {
	parentRequired?: T['ParentRequired'];
	validParentClasses?: T['ValidParents'];
	validChildClasses?: T['ValidChildren'];
};

/** The argument passed to the constructor of a new UserComponentModel class (e.g. TableModel, DimensionModel, etc) */
export type UserComponentModelInit<T extends GenericsShape = GenericsDefaults> = {
	attributes: MaybeGetter<T['Attributes']>;
	validationErrors: MaybeGetter<ValidateError[]>;
	parent: Parent<T>;
	deps: QueryDependencies;
	/** Project semantic-metrics catalog, used to compile a `metric=` reference. */
	metricsCatalog?: MetricsCatalog;
	serialized?: T['Serialized'];
};

export type UserComponentModelClass<
	T extends GenericsShape = {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Attributes: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Serialized: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ParentRequired: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ValidParents: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ValidChildren: any;
	}
> = {
	new (init: UserComponentModelInit<T>): UserComponentModel<T>;
};
