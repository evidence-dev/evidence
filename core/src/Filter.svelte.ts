import {
	DEFAULT_PROJECT_SETTINGS,
	type ProjectSettings
} from './user-components/interfaces/project-settings';
import { extract, type MaybeGetter } from 'runed';
import type { SqlDialect } from './sql-dialect';

export type FilterOpts<T> = {
	initialValue?: T;
	dontUseQueryParam?: boolean;
	queryOnly?: boolean;
	serialize: (value: T | undefined) => string | undefined;
	deserialize: (raw: string) => T | undefined;
};

export type SerializedFilter = {
	init: Omit<FilterInit, 'url'>;
};

/**
 * Filter manages a single input's state and URL persistence.
 *
 * ## URL Update Architecture (DI pattern)
 *
 * Filter does NOT import any SvelteKit APIs. Instead, the caller injects URL behavior via `FilterDeps`:
 * - `url`: how to READ the current URL (e.g. `() => page.url`)
 * - `updateUrl`: how to WRITE URL changes (must use `window.history.replaceState`, NOT SvelteKit's `replaceState`)
 *
 * ⚠️ CRITICAL: The `updateUrl` callback MUST use `window.history.replaceState(window.history.state, '', url)`.
 * SvelteKit's `replaceState` from `$app/navigation` triggers internal page state updates that cause
 * `{#key JSON.stringify(page.data)}` blocks in layouts to re-fire, destroying the component tree.
 * This breaks continuous interactions (slider drags) and only manifests in production builds.
 *
 * This lets the same Filter class work in editor (no URL writes), published/preview/embedded
 * (replaceState), and server-side (no URL at all).
 *
 * ## ⚠️ Critical: `setDefault()` vs `filter.value =`
 *
 * - `filter.value = x` → updates internal state AND writes to the URL (via updateUrl)
 * - `filter.setDefault(x)` → updates internal state ONLY (no URL write)
 *
 * Input components that set programmatic defaults (select_first, default date ranges, etc.)
 * MUST use `setDefault()`. Using `filter.value =` for programmatic defaults can trigger
 * `replaceState` before the SvelteKit router is initialized, causing crashes.
 *
 * Use `filter.value =` only for explicit user interactions (dropdown selection, typing, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Filter<Value = any> {
	/**
	 * Default template property for different contexts
	 * Subclasses can override this to define context-aware defaults
	 *
	 * - sql: Raw SQL expressions (where, having) - typically needs quoted values (.selected)
	 * - text: Display text (title, subtitle) - needs unquoted values (.literal)
	 * - column: Column expressions in quoted attributes (x, y) - needs unquoted values (.literal)
	 */
	static defaultProperty: { sql: string; text: string; column: string } = {
		sql: 'selected',
		text: 'literal',
		column: 'literal'
	};

	get value() {
		return this.#value;
	}

	set value(newValue: Value | undefined) {
		this.#value = newValue;

		// Skip URL updates during initialization
		if (this.#isInitializing) {
			return;
		}

		if (!this.opts.dontUseQueryParam && this.deps.updateUrl) {
			const currentUrl = extract(this.deps.url);
			if (currentUrl) {
				const url = new URL(currentUrl);
				const serialized = this.opts.serialize(newValue);
				if (serialized) {
					url.searchParams.set(this.id, serialized);
				} else {
					url.searchParams.delete(this.id);
				}

				this.deps.updateUrl(url);
			}
		}
	}

	/**
	 * Set a programmatic default value without writing to the URL.
	 * Use this for select_first, default ranges, and other auto-selected defaults.
	 * User interactions should use `filter.value = ...` which updates the URL.
	 */
	setDefault(newValue: Value | undefined) {
		this.#value = newValue;
	}

	/** Current value in its serialized (URL-param) string form. */
	get serializedValue(): string | undefined {
		return this.opts.serialize(this.value);
	}

	/**
	 * Apply a value in its serialized (URL-param) string form, as a user
	 * interaction: updates state AND the URL. Empty/undefined clears the filter.
	 */
	applySerialized(raw: string | undefined) {
		this.value = raw ? this.opts.deserialize(raw) : undefined;
	}

	get queryOnly() {
		return this.opts.queryOnly ?? false;
	}

	protected readonly projectSettings = $derived.by(() =>
		extract(this.deps.projectSettings, DEFAULT_PROJECT_SETTINGS)
	);

	protected get dialect(): SqlDialect | undefined {
		return extract(this.deps.dialect);
	}

	abstract attributes: Record<string, unknown>;

	/** The filter's WHERE predicate for the consumer's `dialect`, or `undefined` when it contributes none. */
	predicateSql(_dialect?: SqlDialect): string | undefined {
		return undefined;
	}

	get sql(): string | undefined {
		return this.predicateSql(this.dialect);
	}

	abstract get templateValues(): Record<string, unknown>;

	#value: Value | undefined = $state(undefined);
	#isInitializing = true;

	constructor(
		readonly id: string,
		readonly userComponentName: string,
		private readonly opts: FilterOpts<Value>,
		private readonly deps: FilterDeps
	) {
		if (!opts.dontUseQueryParam) {
			const raw = extract(this.deps.url)?.searchParams.get(this.id);
			if (raw) {
				this.value = this.opts.deserialize(raw);
			} else if (opts.initialValue) {
				this.value = opts.initialValue;
			}
		} else if (opts.initialValue) {
			this.value = opts.initialValue;
		}

		// Mark initialization complete after constructor finishes
		this.#isInitializing = false;
	}

	toSerialized(): SerializedFilter {
		return {
			init: {
				id: this.id,
				userComponentName: this.userComponentName,
				attributes: this.attributes
			}
		};
	}
}

export type FilterInit<
	UserComponentName extends string = string,
	Attributes extends Record<string, unknown> = Record<string, unknown>
> = {
	id: string;
	userComponentName: UserComponentName;
	attributes: Omit<Attributes, 'id'>;
};

// NOTE: When adding fields to this object, use `| undefined` rather than `?` to make a property optional. This
// makes it so that dependencies must be explicitly ommitted rather than forgotten, resulting in more intentful usage.
export type FilterDeps = {
	url: MaybeGetter<URL> | undefined;
	/**
	 * Callback to update the browser URL when a filter value changes.
	 * Not called during construction or via setDefault().
	 *
	 * MUST use `window.history.replaceState(window.history.state, '', url)`.
	 * Do NOT use SvelteKit's `replaceState` from `$app/navigation` — it triggers
	 * internal page state updates that destroy the component tree in production builds.
	 */
	updateUrl: ((url: URL) => void) | undefined;
	projectSettings:
		| MaybeGetter<ProjectSettings & { computedDefaultDateRangeEnd?: string }>
		| undefined;
	/**
	 * A getter, not a value: the warehouse mode can settle after the filter tree exists, and a
	 * snapshot taken before then would keep escaping for the wrong dialect.
	 */
	dialect: MaybeGetter<SqlDialect> | undefined;
};

export type FilterClass<
	TagName extends string = string,
	Attributes extends Record<string, unknown> = Record<string, unknown>
> = new (init: FilterInit<TagName, Attributes>, deps: FilterDeps) => Filter;
