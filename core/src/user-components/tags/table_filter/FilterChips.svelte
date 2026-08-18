<script lang="ts">
	import { XIcon } from 'lucide-svelte';
	import { getFilterContext } from './filterUtils.svelte';
	import type {
		FilterCondition,
		ColumnFilter,
		StringOperator,
		NumberOperator,
		BooleanOperator,
		DateOperator
	} from './types';
	import * as Popover from '../../../shadcn/components/ui/popover';
	import * as Command from '../../../shadcn/components/ui/command';
	import StringValueSelector from './StringValueSelector.svelte';
	import DateRangeSelector from './DateRangeSelector.svelte';
	import NumericValueSelector from './NumericValueSelector.svelte';
	import formatTitle from '../../formatTitle';
	import { parseDateStringAsLocalMidnight } from '../../../utils/date-utils';

	let {
		data,
		minimumRecords = null,
		columnLabels = new Map<string, string>(),
		columnAllowsMultiple = () => true,
		require_selection = []
	} = $props<{
		data: string;
		minimumRecords?: number | null;
		columnLabels?: Map<string, string>;
		columnAllowsMultiple?: (columnName: string) => boolean;
		require_selection?: string[];
	}>();

	// Helper function to get the display label for a column
	function getColumnLabel(columnName: string): string {
		return columnLabels.get(columnName) ?? formatTitle(columnName);
	}

	const filterContext = getFilterContext(data);
	if (!filterContext) throw new Error('Filter context not found');

	// Create a derived state that forces reactivity to filter changes
	let activeFilters = $derived(filterContext.filterState.filters);
	let hasFilters = $derived(activeFilters.length > 0);

	// Track which filter's value popover is open
	let openValuePopover = $state<string | null>(null);

	// Function to handle value popover open/close
	function toggleValuePopover(columnId: string | null) {
		openValuePopover = columnId;
	}

	// Function to handle value selection close
	function handleValueSelectorClose() {
		openValuePopover = null;
	}

	// Define the operator display mapping type
	type OperatorDisplayMap = {
		[key in FilterCondition['operator']]: string;
	};

	// Define the filter type
	type Filter = {
		columnId: string;
		conditions: FilterCondition[];
	};

	// Define the operator display mapping
	const operatorDisplayMap: OperatorDisplayMap = {
		// String operators
		is: 'is',
		is_not: 'is not',
		contains: 'contains',
		not_contains: 'does not contain',
		starts_with: 'starts with',
		not_starts_with: 'does not start with',
		ends_with: 'ends with',
		not_ends_with: 'does not end with',
		in: 'is',
		not_in: 'is not',

		// Number operators
		equals: '=',
		not_equals: '≠',
		greater_than: '>',
		less_than: '<',
		between: 'is between',
		not_between: 'is not between',

		// Date operators
		before: 'before',
		after: 'after'
	};

	const oppositeOperators = {
		string: {
			is: 'is_not',
			is_not: 'is',
			contains: 'not_contains',
			not_contains: 'contains',
			starts_with: 'not_starts_with',
			not_starts_with: 'starts_with',
			ends_with: 'not_ends_with',
			not_ends_with: 'ends_with',
			in: 'not_in',
			not_in: 'in'
		},
		number: {
			equals: 'not_equals',
			not_equals: 'equals',
			greater_than: 'less_than',
			less_than: 'greater_than',
			between: 'not_between',
			not_between: 'between'
		},
		boolean: {
			is: 'is_not',
			is_not: 'is'
		},
		date: {
			equals: 'not_equals',
			not_equals: 'equals',
			before: 'after',
			after: 'before',
			between: 'not_between',
			not_between: 'between'
		}
	} satisfies {
		string: Record<StringOperator, StringOperator>;
		number: Record<NumberOperator, NumberOperator>;
		boolean: Record<BooleanOperator, BooleanOperator>;
		date: Record<DateOperator, DateOperator>;
	};

	// Function to remove a specific filter
	function removeFilter(columnId: string) {
		if (!filterContext) return;

		const filterState = filterContext.filterState;
		filterState.filters = filterState.filters.filter(
			(filter: ColumnFilter) => filter.columnId !== columnId
		);
		// If no filters left, set active to false
		filterState.active = filterState.filters.length > 0;
	}

	// Inverting a constrained column escapes the selection its author scoped the page to
	function canToggleOperator(filter: Filter) {
		if (minimumRecords !== null) return false;
		if (filter.conditions[0]?.type !== 'string') return true;
		return columnAllowsMultiple(filter.columnId) && !require_selection.includes(filter.columnId);
	}

	// Function to toggle a condition to its opposite
	function toggleCondition(filter: Filter) {
		if (!filterContext || !canToggleOperator(filter)) return;

		const condition = filter.conditions[0];
		if (!condition) return;

		// Keyed by condition type so a toggle can only ever produce an operator that type
		// supports — a cross-type operator generates no SQL and breaks URL round-tripping
		switch (condition.type) {
			case 'string':
				condition.operator = oppositeOperators.string[condition.operator];
				break;
			case 'number':
				condition.operator = oppositeOperators.number[condition.operator];
				break;
			case 'boolean':
				condition.operator = oppositeOperators.boolean[condition.operator];
				break;
			case 'date':
				condition.operator = oppositeOperators.date[condition.operator];
				break;
		}
	}

	// Function to check if a filter is a date filter
	function isDateFilter(filter: Filter) {
		return filter.conditions[0]?.type === 'date';
	}

	// Function to check if a filter is a numeric filter
	function isNumericFilter(filter: Filter) {
		return filter.conditions[0]?.type === 'number';
	}

	// Function to check if a filter is a boolean filter
	function isBooleanFilter(filter: Filter) {
		return filter.conditions[0]?.type === 'boolean';
	}

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

	// Function to format a date in a compact way
	function formatDateCompact(date: Date): string {
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		const day = date.getDate();
		const month = months[date.getMonth()];
		const year = date.getFullYear().toString().slice(2);

		return `${month} ${day} '${year}`;
	}

	// Function to get display parts for a filter
	function getFilterDisplayParts(filter: Filter) {
		if (!filterContext) return { column: '', operator: '', value: '' };

		const condition = filter.conditions[0];
		if (!condition) return { column: '', operator: '', value: '' };

		// Get a friendly operator display
		const operatorDisplay = operatorDisplayMap[condition.operator] ?? condition.operator;

		switch (condition.type) {
			case 'string':
				if (
					(condition.operator === 'in' || condition.operator === 'not_in') &&
					Array.isArray(condition.value)
				) {
					return {
						column: filter.columnId,
						operator: operatorDisplay,
						value: condition.value.join(', ')
					};
				}
				return {
					column: filter.columnId,
					operator: operatorDisplay,
					value: condition.value as string
				};
			case 'number':
				if (
					(condition.operator === 'between' || condition.operator === 'not_between') &&
					condition.maxValue !== undefined
				) {
					return {
						column: filter.columnId,
						operator: operatorDisplay,
						value: `${condition.value} and ${condition.maxValue}`
					};
				}
				return {
					column: filter.columnId,
					operator: operatorDisplay,
					value: condition.value.toString()
				};
			case 'boolean':
				return {
					column: filter.columnId,
					operator: '',
					value: condition.value ? 'Yes' : 'No'
				};
			case 'date':
				if (
					(condition.operator === 'between' || condition.operator === 'not_between') &&
					condition.maxValue !== undefined
				) {
					const fromDate = parseFilterDate(condition.value);
					const toDate = parseFilterDate(condition.maxValue);
					return {
						column: filter.columnId,
						operator: operatorDisplay,
						value: `${formatDateCompact(fromDate)} & ${formatDateCompact(toDate)}`
					};
				}
				{
					const date = parseFilterDate(condition.value);
					return {
						column: filter.columnId,
						operator: operatorDisplay,
						value: formatDateCompact(date)
					};
				}
			default:
				return {
					column: filter.columnId,
					operator: '',
					value: ''
				};
		}
	}
</script>

{#if hasFilters}
	{#each activeFilters as filter}
		<div
			class="bg-background flex h-6 self-center rounded border text-xs whitespace-nowrap shadow-xs"
		>
			<div class="border-accent flex items-center border-r px-2">
				{getColumnLabel(getFilterDisplayParts(filter).column)}
			</div>

			{#if isBooleanFilter(filter)}
				<button
					type="button"
					class="border-accent text-primary/70 hover:bg-muted flex cursor-pointer items-center border-r px-2"
					onclick={() => {
						const condition = filter.conditions[0];
						if (condition) {
							condition.value = !condition.value;
						}
					}}
				>
					{getFilterDisplayParts(filter).value}
				</button>
			{:else}
				{@const operatorToggleable = canToggleOperator(filter)}
				<button
					type="button"
					class:cursor-pointer={operatorToggleable}
					class:hover:bg-muted={operatorToggleable}
					class="border-accent text-primary/70 flex items-center border-r px-2 select-none"
					onclick={() => toggleCondition(filter)}
					disabled={!operatorToggleable}
				>
					{getFilterDisplayParts(filter).operator}
				</button>

				<Popover.Root
					open={openValuePopover === filter.columnId}
					onOpenChange={(open) => toggleValuePopover(open ? filter.columnId : null)}
				>
					<Popover.Trigger>
						<div
							class="border-accent text-primary/70 hover:bg-muted flex h-full max-w-[200px] cursor-pointer items-center border-r px-2"
							title={getFilterDisplayParts(filter).value}
						>
							<span class="block truncate">
								{getFilterDisplayParts(filter).value}
							</span>
						</div>
					</Popover.Trigger>
					<Popover.Content class="evidence-page-theme p-0" align="start">
						<Command.Root>
							{#if isDateFilter(filter)}
								<DateRangeSelector
									columnName={filter.columnId}
									columnLabel={getColumnLabel(filter.columnId)}
									onClose={handleValueSelectorClose}
									filterState={filterContext.filterState}
								/>
							{:else if isNumericFilter(filter)}
								<NumericValueSelector
									columnName={filter.columnId}
									columnLabel={getColumnLabel(filter.columnId)}
									onClose={handleValueSelectorClose}
									filterState={filterContext.filterState}
									{data}
								/>
							{:else}
								{#key openValuePopover}
									<StringValueSelector
										columnName={filter.columnId}
										columnLabel={getColumnLabel(filter.columnId)}
										onClose={handleValueSelectorClose}
										filterState={filterContext.filterState}
										tableExpressionName={data}
										{minimumRecords}
										multiple={columnAllowsMultiple(filter.columnId)}
										requireSelection={require_selection.includes(filter.columnId)}
									/>
								{/key}
							{/if}
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			{/if}

			{#if !require_selection.includes(filter.columnId)}
				<button
					class="hover:bg-muted flex items-center justify-center px-1.5"
					onclick={() => removeFilter(filter.columnId)}
				>
					<XIcon class="size-3" />
				</button>
			{/if}
		</div>
	{/each}
{/if}
