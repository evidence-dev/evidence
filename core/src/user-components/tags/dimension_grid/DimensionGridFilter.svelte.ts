import { Filter, type FilterDeps, type FilterInit } from '../../../Filter.svelte';
import {
	defaultDialect,
	escapeSqlValue,
	isSimpleIdentifier,
	type SqlDialect
} from '../../../sql-dialect';
import type { UserComponentProps } from '../../types';
import type { schema } from './schema';

/**
 * Value shape for DimensionGrid filter
 * Keys are dimension column names, values are selected values (single or array)
 * Example: { category: ['Electronics', 'Clothing'], region: 'West' }
 */
export type DimensionGridValue = Record<string, string | string[]>;

type DimensionGridAttributes = UserComponentProps<typeof schema> & {
	// Internal: dimension columns detected or provided
	_dimensionColumns?: string[];
};

export class DimensionGridFilter extends Filter<DimensionGridValue> {
	attributes: Omit<DimensionGridAttributes, 'id'>;

	/**
	 * Keys arrive as JSON in a URL param and land where a column name goes. Once dimensions are
	 * detected only a detected key survives; before that, only a form that can fail to resolve.
	 */
	private columnFor(dimension: string): string | undefined {
		const declared = this.attributes._dimensionColumns;
		if (Array.isArray(declared) && declared.length > 0 && !declared.includes(dimension))
			return undefined;
		// Identifier quoting doesn't neutralise a backslash on warehouses that honour it.
		if (dimension.includes('\\')) return undefined;
		// A bare identifier can't carry SQL, and quoting it would break case-folding warehouses.
		if (isSimpleIdentifier(dimension)) return dimension;
		return (this.dialect ?? defaultDialect).quoteIdentifierIfNeeded(dimension);
	}

	private selections(): { dimension: string; column: string; selection: string | string[] }[] {
		const selections: { dimension: string; column: string; selection: string | string[] }[] = [];
		for (const [dimension, selection] of Object.entries(this.value ?? {})) {
			const column = this.columnFor(dimension);
			if (column !== undefined) selections.push({ dimension, column, selection });
		}
		return selections;
	}

	predicateSql(dialect?: SqlDialect): string | undefined {
		const conditions: string[] = [];

		// Security (dimension allowlist + backslash reject) stays here; quoting and
		// value escaping use the passed dialect (mirrors `columnFor`).
		const declared = this.attributes._dimensionColumns;
		for (const [dimension, selection] of Object.entries(this.value ?? {})) {
			if (Array.isArray(declared) && declared.length > 0 && !declared.includes(dimension)) continue;
			if (dimension.includes('\\')) continue;
			if (!selection) continue;
			const column = isSimpleIdentifier(dimension)
				? dimension
				: (dialect ?? defaultDialect).quoteIdentifierIfNeeded(dimension);
			if (Array.isArray(selection)) {
				if (selection.length === 0) continue;
				if (selection.length === 1) {
					conditions.push(`${column} = '${escapeSqlValue(String(selection[0]), dialect)}'`);
				} else {
					conditions.push(
						`${column} IN (${selection.map((v) => `'${escapeSqlValue(String(v), dialect)}'`).join(', ')})`
					);
				}
			} else {
				conditions.push(`${column} = '${escapeSqlValue(String(selection), dialect)}'`);
			}
		}

		if (conditions.length === 0) return undefined;
		return conditions.join(' AND ');
	}

	get templateValues(): Record<string, unknown> {
		const templateValues: Record<string, unknown> = {};
		const selections = this.selections();

		if (selections.length === 0) {
			templateValues.selected = {};
			templateValues.filter = 'true';
			templateValues.literal = '';
			return templateValues;
		}

		// Generate SQL filter expression
		templateValues.filter = this.sql ?? 'true';

		// Expose selections as an object
		templateValues.selected = Object.fromEntries(
			selections.map(({ dimension, selection }) => [dimension, selection])
		);

		// Also expose each dimension's selections as direct properties for convenient access
		// e.g., {{filter.category}} returns ('Electronics', 'Clothing')
		for (const { dimension, selection } of selections) {
			if (Array.isArray(selection)) {
				templateValues[dimension] =
					selection.length > 0
						? `(${selection.map((v) => `'${escapeSqlValue(String(v), this.dialect)}'`).join(', ')})`
						: '';
			} else {
				templateValues[dimension] = selection
					? `'${escapeSqlValue(String(selection), this.dialect)}'`
					: '';
			}
		}

		// Human-readable summary
		const parts: string[] = [];
		for (const { dimension, selection } of selections) {
			if (!selection) continue;
			const values = Array.isArray(selection) ? selection : [selection];
			if (values.length > 0) {
				parts.push(`${dimension}: ${values.join(', ')}`);
			}
		}
		templateValues.literal = parts.join('; ');

		return templateValues;
	}

	constructor(init: FilterInit<'dimension_grid', DimensionGridAttributes>, deps: FilterDeps) {
		super(
			init.id,
			init.userComponentName,
			{
				initialValue: undefined,
				serialize: (value) => {
					if (!value || Object.keys(value).length === 0) return undefined;
					// Only serialize dimensions that have selections
					const filtered = Object.fromEntries(
						Object.entries(value).filter(([, v]) => {
							if (Array.isArray(v)) return v.length > 0;
							return v !== undefined && v !== '';
						})
					);
					if (Object.keys(filtered).length === 0) return undefined;
					return JSON.stringify(filtered);
				},
				deserialize: (raw) => {
					if (raw.startsWith('{')) {
						try {
							return JSON.parse(raw) as DimensionGridValue;
						} catch {
							return undefined;
						}
					}
					return undefined;
				}
			},
			deps
		);

		this.attributes = $state(init.attributes);
	}

	/**
	 * Set the selected value(s) for a specific dimension
	 */
	setDimensionValue(dimension: string, values: string | string[] | undefined): void {
		const current = this.value ?? {};
		if (!values || (Array.isArray(values) && values.length === 0)) {
			const { [dimension]: _, ...rest } = current;
			this.value = Object.keys(rest).length > 0 ? rest : undefined;
		} else {
			this.value = { ...current, [dimension]: values };
		}
	}

	/**
	 * Get the selected values for a specific dimension as an array
	 */
	getDimensionValue(dimension: string): string[] {
		const selection = this.value?.[dimension];
		if (!selection) return [];
		return Array.isArray(selection) ? selection : [selection];
	}

	/**
	 * Toggle a value for a specific dimension
	 */
	toggleValue(dimension: string, value: string, multiple: boolean): void {
		const current = this.getDimensionValue(dimension);
		const isSelected = current.includes(value);

		if (multiple) {
			if (isSelected) {
				this.setDimensionValue(
					dimension,
					current.filter((v) => v !== value)
				);
			} else {
				this.setDimensionValue(dimension, [...current, value]);
			}
		} else {
			// Single selection mode
			if (isSelected) {
				this.setDimensionValue(dimension, undefined);
			} else {
				this.setDimensionValue(dimension, value);
			}
		}
	}

	/**
	 * Clear selections for a specific dimension
	 */
	clearDimension(dimension: string): void {
		this.setDimensionValue(dimension, undefined);
	}

	/**
	 * Clear all selections
	 */
	clearAll(): void {
		this.value = undefined;
	}
}
