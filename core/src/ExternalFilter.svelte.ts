import { Filter, type FilterDeps, type FilterInit } from './Filter.svelte';
import { escapeSqlValue, type SqlDialect } from './sql-dialect';
import { renderColumnPredicate } from './filter-predicate';

type ExternalFilterAttributes = {
	initial_value?: unknown;
	/**
	 * Optional column this filter is bound to. When set, the filter behaves like
	 * a builtin (e.g. dropdown): `sql` emits a `column = value` / `column IN (…)`
	 * predicate so the chart `filters="…"` prop auto-applies it, and
	 * `{{ id.filter }}` resolves to that predicate. When omitted, the filter is a
	 * loose value referenced explicitly via `{{ id }}` / `{{ id.selected }}`.
	 */
	column?: string;
};

/**
 * A value-holder filter created at RUNTIME by author code — today, an
 * `{% html %}` block calling `evidence.filters.create(id, value, { column })` —
 * rather than by an input component in the markdown AST.
 *
 * What makes it different from a typed filter (dropdown, slider, …):
 *  - It is NOT anchored to an AST node. `Filters` tracks it as "external" so
 *    `registerFiltersFromAST` doesn't reap it on the next render (it would
 *    otherwise vanish the moment anything re-registers filters). Its owner (the
 *    html component) removes it on unmount.
 *
 * Otherwise it mirrors the dropdown: with a `column` it produces a real
 * predicate (auto-applies via the `filters=` prop and `{{ id.filter }}`);
 * without one it's the column-less case (`sql` undefined, `filter` = `'true'`).
 */
export class ExternalFilter extends Filter<unknown> {
	attributes: ExternalFilterAttributes;

	predicateSql(dialect?: SqlDialect): string | undefined {
		const column = this.attributes.column;
		if (!column) return undefined;
		return renderColumnPredicate(column, this.value, dialect);
	}

	get templateValues(): Record<string, unknown> {
		const column = this.attributes.column;
		const value = this.value;
		if (Array.isArray(value)) {
			if (value.length === 0) return { selected: '', literal: '', filter: 'true' };
			const selected = `(${value.map((v) => `'${escapeSqlValue(String(v), this.dialect)}'`).join(', ')})`;
			return {
				selected,
				literal: value.join(', '),
				filter: column ? `${column} IN ${selected}` : 'true'
			};
		}
		if (value === undefined || value === null || value === '') {
			return { selected: '', literal: '', filter: 'true' };
		}
		return {
			selected: `'${escapeSqlValue(String(value), this.dialect)}'`,
			literal: value,
			filter: column ? `${column}='${escapeSqlValue(String(value), this.dialect)}'` : 'true'
		};
	}

	constructor(init: FilterInit<'html', ExternalFilterAttributes>, deps: FilterDeps) {
		super(
			init.id,
			init.userComponentName,
			{
				initialValue: init.attributes.initial_value,
				serialize: (v) => {
					if (v === undefined || v === null || (Array.isArray(v) && v.length === 0))
						return undefined;
					if (Array.isArray(v)) return JSON.stringify(v);
					return String(v);
				},
				deserialize: (raw) => {
					if (raw.startsWith('[')) {
						try {
							const parsed = JSON.parse(raw);
							if (Array.isArray(parsed)) return parsed;
						} catch {
							// Not valid JSON — fall through to the raw string.
						}
					}
					return raw;
				}
			},
			deps
		);
		this.attributes = $state(init.attributes);
	}
}
