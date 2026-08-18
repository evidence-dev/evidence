<script lang="ts">
	import * as Command from '../../../shadcn/components/ui/command';
	import type { FilterState, ColumnFilter } from './types';
import { DEFAULT_VISIBLE_PRESET_DEFINITIONS, processDateRange } from '../../common/date-options';
	import { getProjectSettingsContext } from '../../../project-settings.context';
	import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';

	let { columnName, columnLabel, onClose, filterState } = $props<{
		columnName: string;
		columnLabel: string;
		onClose: () => void;
		filterState: FilterState;
	}>();

	// Get project settings for first day of week and anchor date
	const getProjectSettings = getProjectSettingsContext();
	const projectSettings = $derived(getProjectSettings());
	const firstDayOfWeek = $derived(projectSettings.first_day_of_week || 'sunday');

	// Get anchor date for date range calculations
	const anchorDate = $derived(
		projectSettings.computedDefaultDateRangeEnd
			? parseDateStringAsLocalMidnight(projectSettings.computedDefaultDateRangeEnd)
			: new Date()
	);

	// Use the same default-visible presets as range calendar, excluding 'all time'
	const timePeriods = DEFAULT_VISIBLE_PRESET_DEFINITIONS.filter(
		(preset) => preset.key !== 'all time'
	).map(
		(preset) => ({
			label: preset.label,
			key: preset.key
		})
	);

	// State for custom date range
	let startDate = $state<Date | null>(null);
	let endDate = $state<Date | null>(null);

	// Helper function to safely parse date values that might be Date objects or strings
	function parseFilterDate(value: Date | string): Date {
		if (value instanceof Date) {
			return value;
		}
		// If it's a string in YYYY-MM-DD format, parse as local midnight
		if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
			return parseDateStringAsLocalMidnight(value);
		}
		// Fallback for other formats
		return new Date(value);
	}

	// Initialize values from existing filter if available
	$effect(() => {
		if (!columnName) return;

		// Find existing filter for this column
		const existingFilter = filterState.filters.find(
			(filter: ColumnFilter) => filter.columnId === columnName
		);

		if (!existingFilter || existingFilter.conditions.length === 0) return;

		const condition = existingFilter.conditions[0];
		if (condition.type !== 'date') return;

		// Set dates based on the operator, using safe parsing
		if (condition.operator === 'between' && condition.maxValue !== undefined) {
			startDate = parseFilterDate(condition.value);
			endDate = parseFilterDate(condition.maxValue);
		}
	});

	// Function to handle time period selection
	function handleTimePeriodSelect(presetKey: string) {
		// Use processDateRange to convert preset key to actual dates
		// Pass anchorDate and firstDayOfWeek for consistent date calculations
		const { startDate: startDateStr, endDate: endDateStr } = processDateRange(
			presetKey,
			undefined,
			anchorDate,
			firstDayOfWeek
		);

		// Use parseDateStringAsLocalMidnight to avoid timezone issues
		if (startDateStr) {
			startDate = parseDateStringAsLocalMidnight(startDateStr);
		}
		if (endDateStr) {
			endDate = parseDateStringAsLocalMidnight(endDateStr);
		}

		applyFilter();
	}

	// Function to apply the current date filter
	function applyFilter() {
		// Remove any existing filter for this column
		filterState.filters = filterState.filters.filter(
			(filter: ColumnFilter) => filter.columnId !== columnName
		);

		// Add the new filter based on the selected dates
		if (startDate && endDate) {
			filterState.filters.push({
				columnId: columnName,
				conditions: [
					{
						type: 'date',
						operator: 'between',
						value: startDate,
						maxValue: endDate
					}
				]
			});
			filterState.active = true;
		}

		// Close the dropdown
		onClose();
	}

	let inputRef = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (inputRef) {
			inputRef.focus();
		}
	});
</script>

<div class="p-1">
	<Command.Input placeholder={columnLabel} class="h-9" bind:ref={inputRef} />
	<Command.List class="p-1">
		{#each timePeriods as period}
			<Command.Item onSelect={() => handleTimePeriodSelect(period.key)}>
				<span>{period.label}</span>
			</Command.Item>
		{/each}
	</Command.List>
</div>
