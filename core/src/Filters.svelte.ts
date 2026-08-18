import { SvelteMap } from 'svelte/reactivity';
import { getFilterClassByUserComponentName } from '.';
import type {
	Filter,
	FilterClass,
	FilterDeps,
	FilterInit,
	SerializedFilter
} from './Filter.svelte';
import { ExternalFilter } from './ExternalFilter.svelte';
import { useId } from 'bits-ui';
import { logger } from './shims/logger';

export type SerializedFilters = {
	[filterId: string]: SerializedFilter;
};

export class Filters {
	readonly id = useId('Filters');

	readonly #filters: SvelteMap<string, Filter>;

	/**
	 * Ids of filters created at runtime by author code (e.g. an `{% html %}`
	 * block via `evidence.filters.create`) rather than by an AST input
	 * component. `registerFiltersFromAST` must skip these when it reaps filters
	 * that no longer have a backing AST node — they have no AST node by design.
	 */
	readonly #externalIds = new Set<string>();

	/**
	 * Subset of `#externalIds` that were pre-registered by the AST walker via a
	 * static scan of `{% html %}` block bodies. Tracking them separately gives
	 * the walker a way to reap them when the source-level `evidence.filters.create`
	 * call disappears (block edited / deleted) — pure runtime-only externals
	 * (dynamic ids, computed metadata) stay reaped only by the html block's own
	 * unmount cleanup, since the walker can never have seen them.
	 */
	readonly #staticExternalIds = new Set<string>();

	get filterIds(): string[] {
		return Array.from(this.#filters.keys());
	}

	get componentFilterIds(): string[] {
		return Array.from(this.#filters.entries())
			.filter(([_, filter]) => !filter.queryOnly)
			.map(([id, _]) => id);
	}

	constructor(
		private readonly deps: FilterDeps,
		serialized: SerializedFilters = {}
	) {
		const deserializedFilters = Filters.deserialize(serialized, deps);
		this.#filters = new SvelteMap<string, Filter>(deserializedFilters);
	}

	create<
		UserComponentName extends string,
		Attributes extends Record<string, unknown>,
		C extends FilterClass<UserComponentName, Attributes>
	>(init: FilterInit<UserComponentName, Attributes>, Class: C): InstanceType<C> {
		const filter = new Class(init, this.deps);
		this.#filters.set(filter.id, filter);
		return filter as InstanceType<C>;
	}

	/**
	 * Create (or look up) a filter owned by author runtime code, not the AST.
	 * Used by `evidence.filters.create(id, value)` inside an `{% html %}` block
	 * so a block can declare its own page filters (e.g. a hand-rolled dropdown)
	 * instead of only setting ones a component already declared.
	 *
	 * Pass `column` to make it a column-bound filter (behaves like a builtin: its
	 * `sql` predicate auto-applies via the chart `filters="…"` prop); omit it for
	 * a loose value referenced via `{{ id }}`.
	 *
	 * Collision rule: if a filter with this id already exists we DEFER to it and
	 * return it unchanged — a typed AST filter (dropdown/slider) keeps its richer
	 * semantics, and an already-created external filter keeps its current value
	 * (which may have been restored from the URL). `create` is "ensure exists",
	 * not "reset to this value". Seed/overwrite the value with
	 * `evidence.filters.set` instead.
	 *
	 * Static-pre-reg seeding: when `opts.static` is false (the runtime call from
	 * an html block) and the existing filter is an unseeded static pre-reg
	 * (registered by the AST walker before the block ran, with no value yet —
	 * URL state didn't restore one either), we DO seed the value here. This
	 * preserves today's behavior where the block's own first call sets the
	 * filter's initial value: without this fold-back, the static pre-reg's
	 * undefined would win and the chart would show "no filter applied" until
	 * the user interacted, even when the author intended a default.
	 */
	createExternal(
		id: string,
		value: unknown,
		column?: string,
		opts?: { static?: boolean }
	): Filter {
		const existing = this.#filters.get(id);
		if (existing) {
			const isUnseededStatic =
				!opts?.static &&
				this.#staticExternalIds.has(id) &&
				existing instanceof ExternalFilter &&
				existing.value === undefined &&
				value !== undefined;
			if (isUnseededStatic) {
				existing.value = value;
			}
			return existing;
		}

		const filter = new ExternalFilter(
			{ id, userComponentName: 'html', attributes: { initial_value: value, column } },
			this.deps
		);
		this.#filters.set(id, filter);
		this.#externalIds.add(id);
		if (opts?.static) this.#staticExternalIds.add(id);
		return filter;
	}

	/** True if `id` is a runtime-created (author-owned) filter, not an AST one. */
	isExternal(id: string): boolean {
		return this.#externalIds.has(id);
	}

	/**
	 * True if `id` was pre-registered by the AST walker's static scan of an
	 * html block body. The walker uses this to reap stale pre-regs on each
	 * pass without touching purely runtime-only externals.
	 */
	isStaticExternal(id: string): boolean {
		return this.#staticExternalIds.has(id);
	}

	remove(id: string) {
		const filter = this.#filters.get(id);
		if (filter) {
			filter.value = undefined;
		}
		this.#filters.delete(id);
		this.#externalIds.delete(id);
		this.#staticExternalIds.delete(id);
	}

	get(id: string): Filter | undefined {
		return this.#filters.get(id);
	}

	has(id: string) {
		return this.#filters.has(id);
	}

	toString() {
		const acc: Record<string, unknown> = {};
		for (const [filterId, filter] of this.#filters) {
			acc[filterId] = filter.value;
		}
		return JSON.stringify(acc);
	}

	toSerialized(): SerializedFilters {
		// Exclude external (runtime-created) filters: they exist only on the
		// client after an html block mounts, have no registered class to
		// deserialize against, and re-create themselves on the next mount. Their
		// selected value still survives a reload via the URL param.
		return Object.fromEntries(
			Array.from(this.#filters.entries())
				.filter(([id]) => !this.#externalIds.has(id))
				.map(([id, filter]) => [id, filter.toSerialized()])
		);
	}

	static deserialize(
		serialized: SerializedFilters,
		deps: FilterDeps
	): [filterId: string, Filter][] {
		return Object.entries(serialized)
			.map<[string, Filter] | undefined>(([id, serializedFilter]) => {
				const FilterClass = getFilterClassByUserComponentName(
					serializedFilter.init.userComponentName
				);
				if (!FilterClass) {
					logger.error(
						{ userComponentName: serializedFilter.init.userComponentName },
						'Failed to find filter class with name'
					);
					return;
				}

				const filter = new FilterClass(serializedFilter.init, deps);

				return [id, filter];
			})
			.filter((entry): entry is NonNullable<typeof entry> => entry !== undefined);
	}
}
