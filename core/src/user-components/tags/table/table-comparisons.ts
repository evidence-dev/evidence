import type { UnifiedColumnDefinition } from './unified-column-definition.types';
import type { ComparisonQueryConfig } from '../../common/build-comparisons';
import type { DateRangeObject } from '../../common/date-options';
import { logger } from '../../../shims/logger';

/**
 * Generates comparison configs from unified columns with comparison metadata
 * @param allUnifiedColumns - Array of unified column definitions
 * @returns Array of comparison configs
 */
export function generateTableComparisonQueryConfig(
	allUnifiedColumns: UnifiedColumnDefinition[],
	date_range: DateRangeObject
): ComparisonQueryConfig[] {
	const configs = allUnifiedColumns
		.filter((col) => col.type === 'measure' && col.comparison)
		.map((col) => {
			const meta = col.comparison!;

			if (meta.compare_vs === 'target') {
				// For target, create inline comparison config
				if (!meta.targetColumn) {
					logger.warn('target comparison requires target column');
					return null;
				}

				return {
					id: meta.id!,
					compare_vs: meta.compare_vs,
					valueColumn: col.sqlWithoutAlias!,
					valueColumnAlias: col.alias,
					targetColumn: meta.targetColumn
				} as ComparisonQueryConfig;
			} else if (meta.compare_vs === 'benchmark') {
				// For benchmark, create benchmark comparison config
				if (!meta.benchmark) {
					logger.warn('benchmark comparison requires benchmark config');
					return null;
				}

				return {
					id: meta.id!,
					compare_vs: meta.compare_vs,
					valueColumn: col.sqlWithoutAlias!,
					valueColumnAlias: col.alias,
					benchmark: meta.benchmark
				} as ComparisonQueryConfig;
			} else if (meta.compare_vs === 'prior year' || meta.compare_vs === 'prior period') {
				// Get date dimensions for dynamic comparisons (simplified since Table already determined date grain)
				const dateDimensions = allUnifiedColumns
					.filter(
						(col) => (col.type === 'dimension' || col.type === 'pivot') && col.isTemporalDateGrain
					)
					.map((col) => col.sqlWithoutAlias!);

				// Determine if this should be a dynamic comparison
				const hasDateDimensions = dateDimensions.length > 0;

				if (hasDateDimensions) {
					// Dynamic comparison: use date arithmetic in fragment, no static date range
					return {
						id: meta.id!,
						compare_vs: meta.compare_vs,
						valueColumn: col.processedColumnExpression!.sqlWithoutDateFiltersOrAlias!,
						valueColumnAlias: col.alias,
						// For dynamic comparisons, we'll use fragment queries with date arithmetic
						hasDateDimensions: true,
						dateDimensions,
						date_range: meta.date_range ?? date_range,
						dateGrain: meta.dateGrain || 'year' // Table component already set the most granular grain
					} as ComparisonQueryConfig;
				} else {
					// Static comparison: use date ranges
					return {
						id: meta.id!,
						compare_vs: meta.compare_vs,
						valueColumn: col.processedColumnExpression!.sqlWithoutDateFiltersOrAlias!,
						valueColumnAlias: col.alias,
						// Use unified date range object from comparison metadata
						date_range: meta.date_range ?? date_range,
						dateGrain: meta.dateGrain || 'year' // Table component already set the grain
					} as ComparisonQueryConfig;
				}
			}
			return null;
		})
		.filter((config): config is NonNullable<typeof config> => config !== null);

	// Deduplicate comparison configs to avoid identical fragments
	const uniqueConfigs = new Map<string, (typeof configs)[0]>();

	for (const config of configs) {
		// Create a key that identifies unique fragments
		const fragmentKey = [
			config.valueColumn,
			config.compare_vs,
			config.hasDateDimensions,
			config.dateGrain,
			...(config.dateDimensions || []),
			config.date_range?.date,
			config.date_range?.range,
			// Include benchmark fields for deduplication
			config.benchmark?.agg,
			config.benchmark?.subject,
			JSON.stringify(config.benchmark?.within || []),
			config.benchmark?.where,
			config.benchmark?.exclude_self
		].join('|');

		// Keep the first occurrence of each unique fragment
		if (!uniqueConfigs.has(fragmentKey)) {
			uniqueConfigs.set(fragmentKey, config);
		}
	}

	return Array.from(uniqueConfigs.values());
}

/**
 * Determines the most granular date grain from a list of grains
 * @param grains - Array of date grain strings
 * @returns The most granular date grain
 */
export function getMostGranularDateGrain(grains: (string | undefined)[]): string {
	// Define granularity order (most granular first) - only temporal grains
	const granularityOrder = ['hour', 'day', 'week', 'month', 'quarter', 'year'];

	// Filter out undefined values and find the most granular
	const validGrains = grains.filter((grain): grain is string => grain !== undefined);

	if (validGrains.length === 0) {
		return ''; // Default fallback
	}

	// Find the first (most granular) grain that exists in our list
	for (const grain of granularityOrder) {
		if (validGrains.includes(grain)) {
			return grain;
		}
	}

	// If no match found, return the first valid grain
	return validGrains[0];
}
