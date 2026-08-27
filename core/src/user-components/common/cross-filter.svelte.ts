import type { ECharts } from 'echarts';
import type { Filters } from '../../Filters.svelte';
import type { Filter } from '../../Filter.svelte';

export interface CrossFilterConfig {
	chart: () => ECharts | undefined;
	pageFilters: Filters | undefined;
	crossFilter: boolean | string | undefined;
	crossFilterColumn: string | undefined;
	crossFilterMultiple?: boolean;
	id?: string;
}

/**
 * Manages cross-filtering interaction on a chart component.
 * Allows clicking chart elements (bars, slices, points) to filter the page.
 */
export function setupCrossFilter(config: CrossFilterConfig) {
	const isEnabled = () => Boolean(config.crossFilter);

	const targetColumn = () => {
		if (config.crossFilterColumn) return config.crossFilterColumn;
		if (typeof config.crossFilter === 'string' && config.crossFilter !== 'true') {
			return config.crossFilter;
		}
		return undefined;
	};

	const filterId = () => {
		if (typeof config.crossFilter === 'string' && config.crossFilter !== 'true') {
			return config.crossFilter;
		}
		if (config.id) return config.id;
		return targetColumn();
	};

	const getOrCreateFilter = (): Filter | undefined => {
		if (!isEnabled() || !config.pageFilters) return undefined;
		const id = filterId();
		if (!id) return undefined;
		const existing = config.pageFilters.get(id);
		if (existing) return existing;
		return config.pageFilters.createExternal(id, undefined, targetColumn());
	};

	const handleChartClick = (params: {
		name?: string;
		value?: unknown;
		data?: unknown;
		seriesName?: string;
	}) => {
		if (!isEnabled() || !config.pageFilters) return;
		const id = filterId();
		if (!id) return;
		const filter = getOrCreateFilter();
		if (!filter) return;

		// Resolve clicked raw value:
		let clickedValue: unknown = params.name;
		if (clickedValue === undefined || clickedValue === '' || clickedValue === null) {
			if (Array.isArray(params.value)) {
				clickedValue = params.value[0];
			} else if (params.value !== undefined && params.value !== null) {
				clickedValue = params.value;
			} else if (typeof params.data === 'object' && params.data !== null && 'name' in params.data) {
				clickedValue = (params.data as { name: unknown }).name;
			}
		}

		if (clickedValue === undefined || clickedValue === null || clickedValue === '') return;
		const strValue = String(clickedValue);

		if (config.crossFilterMultiple) {
			const currentList: string[] = Array.isArray(filter.value)
				? [...(filter.value as string[])]
				: filter.value != null && filter.value !== ''
					? [String(filter.value)]
					: [];

			const idx = currentList.indexOf(strValue);
			if (idx > -1) {
				currentList.splice(idx, 1);
			} else {
				currentList.push(strValue);
			}
			filter.value = currentList.length > 0 ? currentList : undefined;
		} else {
			const isCurrentlySelected =
				filter.value === strValue ||
				filter.value === clickedValue ||
				(Array.isArray(filter.value) &&
					filter.value.length === 1 &&
					String(filter.value[0]) === strValue);

			if (isCurrentlySelected) {
				filter.value = undefined;
			} else {
				filter.value = strValue;
			}
		}
	};

	return {
		isEnabled,
		filterId,
		targetColumn,
		getFilter: getOrCreateFilter,
		handleChartClick
	};
}
