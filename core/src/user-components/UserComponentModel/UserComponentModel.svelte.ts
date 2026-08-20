import { extract } from 'runed';
import type { Query, QueryDependencies } from '../../Query.svelte';
import type { MetricsCatalog } from '../../metrics/metrics-catalog';
import { useStable } from '../../useStable.svelte';
import { browser } from '../../shims/env';
import { untrack } from 'svelte';
import type {
	GenericsShape,
	GenericsDefaults,
	Parent,
	UserComponentModelOptions,
	Child,
	UserComponentModelInit
} from './types';
import type { ValidateError } from '@markdoc/markdoc';
import { processVariables as processVariablesUtil } from '../common/process-variables';
import { VariableProcessor } from '../../filter-variables/VariableProcessor';
import { DEFAULT_PROJECT_SETTINGS } from '../interfaces/project-settings';

/**
 * Interface for parent components that support variable processing.
 * Used to type-check access to variableProcessor.
 */
interface ParentWithVariableSupport {
	variableProcessor?: VariableProcessor | null;
}

/**
 * Abstract base class to encapsulate UserComponentModel's Parent/Child relationships, attribute reactivity, and serialization
 */
export abstract class UserComponentModel<T extends GenericsShape = GenericsDefaults> {
	readonly attributes: T['Attributes'];

	readonly validationErrors: ValidateError[];

	readonly parent: Parent<T>;

	readonly deps: QueryDependencies;

	/** Project semantic-metrics catalog, used to compile a `metric=` reference. */
	readonly metricsCatalog: MetricsCatalog | undefined;

	readonly children: Child<T>[] = $state([]);

	readonly query?: Query;

	/**
	 * Variable processor for interpolating filter variables.
	 * Created automatically if deps are available (root components).
	 * Supports multiple filter contexts (e.g., page filters + repeat filters).
	 */
	readonly variableProcessor = $derived.by(() => {
		if (!this.deps) return null;
		const inlineQueries = this.deps.inlineQueries;
		if (!inlineQueries) return null;

		// Collect all non-undefined filter contexts (includes repeat filters)
		const filterContexts =
			this.deps.filterContexts?.filter(
				(ctx): ctx is NonNullable<typeof ctx> => ctx !== undefined
			) ?? [];
		if (filterContexts.length === 0) return null;

		return new VariableProcessor(filterContexts, inlineQueries);
	});

	readonly projectSettings = $derived.by(() =>
		extract(this.deps?.projectSettings, DEFAULT_PROJECT_SETTINGS)
	);

	get hasBlockingError(): boolean {
		return this.validationErrors?.some((err) => err.error.level !== 'warning') ?? false;
	}

	constructor(
		init: UserComponentModelInit<T>,
		private readonly options: UserComponentModelOptions<T>
	) {
		// Check if parent is valid during runtime to fail fast and prevent downstream issues
		if (!this.isValidParent(init.parent)) {
			const validParents = [
				...(this.options.parentRequired ? [] : [null]),
				...(this.options.validParentClasses ?? []).map((Class) => Class.name)
			];
			throw new Error(
				`Tried to create ${this.constructor.name} with an invalid parent ${init.parent?.constructor.name}. Valid parents: ${validParents}`
			);
		}

		const attributesGetter = browser
			? useStable(() => extract(init.attributes))
			: () => extract(init.attributes);
		this.attributes = $derived(attributesGetter());

		const validationErrorsGetter = browser
			? useStable(() => extract(init.validationErrors))
			: () => extract(init.validationErrors);
		this.validationErrors = $derived(validationErrorsGetter());

		this.parent = init.parent;

		this.deps = init.deps;

		this.metricsCatalog = init.metricsCatalog;
	}

	/**
	 * Initialize this UserComponentModel (e.g. fetching data from its query)
	 * Used primarily for SSR
	 */
	init?(): Promise<void>;

	/**
	 * Return a POJO representation of this class that can be serialized/deserialized by SvelteKit for server->client during SSR
	 * https://svelte.dev/docs/kit/load#Universal-vs-server-Output
	 */
	toSerialized?(): T['Serialized'];

	/**
	 * Add a child model to this UserComponentModel
	 * @param child The child model to add
	 * @returns A function to remove the child model from this model's children
	 */
	addChild(child: Child<T>): () => void {
		// Check if child is valid during runtime to fail fast and prevent downstream issues
		if (!this.isValidChild(child as unknown)) {
			const validChildren = (this.options.validChildClasses ?? [])?.map((Class) => Class.name);
			throw new Error(
				`Tried to add invalid child ${child.constructor.name} to ${this.constructor.name}. Valid children: ${validChildren}`
			);
		}

		untrack(() => {
			this.children.push(child);
		});
		return () => {
			untrack(() => {
				this.children.splice(this.children.indexOf(child), 1);
			});
		};
	}

	private isValidParent(parent: unknown): parent is Parent<T> {
		if (parent === null) return !this.options.parentRequired;
		if (this.options.validParentClasses === undefined) return true;
		return this.options.validParentClasses.find((Class) => parent instanceof Class) !== undefined;
	}

	private isValidChild(child: unknown): child is Child<T> {
		if (this.options.validChildClasses === undefined) return true;
		return this.options.validChildClasses.find((Class) => child instanceof Class) !== undefined;
	}

	/**
	 * Process variables in an attribute value.
	 *
	 * @param value The attribute value to process
	 * @param context Variable context: 'sql' or 'text'. Defaults to 'text'.
	 * @param options Processing options including type coercion
	 * @returns The value with variables interpolated
	 */
	protected processVariables<V>(
		value: V,
		context?: import('../../interpolate-query-strings').VariableContext,
		options?: import('../common/process-variables').ProcessVariablesOptions
	): V {
		// Use this component's variableProcessor if available (root components with deps)
		// Otherwise fall back to parent's variableProcessor (child components)
		const processor =
			this.variableProcessor ||
			(this.parent as ParentWithVariableSupport | null)?.variableProcessor;

		return processVariablesUtil(value, processor, context, options);
	}

	// ============================================================================
	// SEMANTIC VARIABLE RESOLUTION HELPERS
	// These provide clear, type-safe methods for resolving different kinds of attributes
	// ============================================================================

	/**
	 * Resolve a text/string attribute with variable interpolation.
	 * Use for titles, labels, info text, URLs, etc.
	 *
	 * @example
	 * readonly resolvedTitle = $derived(this.resolveText(this.attributes.title));
	 */
	protected resolveText<V>(value: V): V {
		return this.processVariables(value, 'text');
	}

	/**
	 * Resolve a SQL column expression (unquoted variable values).
	 * Use for column names in x, y, value, category, series, etc.
	 *
	 * @example
	 * readonly resolvedValue = $derived(this.resolveColumn(this.attributes.value));
	 */
	protected resolveColumn<V>(value: V): V {
		return this.processVariables(value, 'column');
	}

	/**
	 * Resolve a SQL expression (quoted variable values).
	 * Use for where, having, order, qualify clauses.
	 *
	 * @example
	 * readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));
	 */
	protected resolveSql<V>(value: V): V {
		return this.processVariables(value, 'sql');
	}

	/**
	 * Resolve a boolean attribute with variable interpolation.
	 * Automatically coerces string "true"/"false" to boolean.
	 * Use for hide, legend, borders, etc.
	 *
	 * @example
	 * readonly resolvedHide = $derived(this.resolveBoolean(this.attributes.hide));
	 */
	protected resolveBoolean(value: boolean | string | undefined): boolean | undefined {
		const result = this.processVariables(value, 'text', { coerce: 'boolean' });
		return result as boolean | undefined;
	}

	/**
	 * Resolve a number attribute with variable interpolation.
	 * Automatically coerces numeric strings to number.
	 * Use for bin_count, bin_width, limit, etc.
	 *
	 * @example
	 * readonly resolvedBinCount = $derived(this.resolveNumber(this.attributes.bin_count));
	 */
	protected resolveNumber(value: number | string | undefined): number | undefined {
		const result = this.processVariables(value, 'text', { coerce: 'number' });
		return result as number | undefined;
	}
}
