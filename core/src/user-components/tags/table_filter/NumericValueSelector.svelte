<script lang="ts">
	import { Button } from '../../../shadcn/components/ui/button';
	import type { FilterState, FilterCondition, ColumnFilter } from './types';
	import { Input } from '../../../shadcn/components/ui/input';
	import { Label } from '../../../shadcn/components/ui/label';
	import Histogram from './Histogram.svelte';

	let {
		columnName,
		columnLabel: _columnLabel,
		onClose,
		filterState,
		data = ''
	} = $props<{
		columnName: string;
		columnLabel: string;
		onClose: () => void;
		filterState: FilterState;
		data: string;
	}>();

	// State for the numeric filter
	let minValue = $state<string>('');
	let maxValue = $state<string>('');
	let minInputRef = $state<HTMLInputElement | null>(null);

	// Initialize values from existing filter if available
	$effect(() => {
		if (!columnName) return;

		// Find existing filter for this column
		const existingFilter = filterState.filters.find(
			(filter: ColumnFilter) => filter.columnId === columnName
		);

		if (!existingFilter || existingFilter.conditions.length === 0) return;

		const condition = existingFilter.conditions[0];
		if (condition.type !== 'number') return;

		// Set values based on the operator
		if (condition.operator === 'greater_than') {
			minValue = condition.value.toString();
		} else if (condition.operator === 'less_than') {
			maxValue = condition.value.toString();
		} else if (condition.operator === 'between' && condition.maxValue !== undefined) {
			minValue = condition.value.toString();
			maxValue = condition.maxValue.toString();
		} else if (condition.operator === 'equals') {
			minValue = condition.value.toString();
			maxValue = condition.value.toString();
		}
	});

	$effect(() => {
		if (minInputRef) {
			minInputRef.focus();
		}
	});

	// Function to handle filter application
	function applyFilter() {
		let conditions: FilterCondition[] = [];

		// If both min and max are empty or "any", don't apply a filter
		if ((!minValue || minValue === 'any') && (!maxValue || maxValue === 'any')) {
			onClose();
			return;
		}

		// If only min is set
		if (minValue && minValue !== 'any' && (!maxValue || maxValue === 'any')) {
			const numericMinValue = parseFloat(minValue);
			if (isNaN(numericMinValue)) return;

			conditions = [
				{
					type: 'number',
					operator: 'greater_than',
					value: numericMinValue
				}
			];
		}
		// If only max is set
		else if ((!minValue || minValue === 'any') && maxValue && maxValue !== 'any') {
			const numericMaxValue = parseFloat(maxValue);
			if (isNaN(numericMaxValue)) return;

			conditions = [
				{
					type: 'number',
					operator: 'less_than',
					value: numericMaxValue
				}
			];
		}
		// If both min and max are set
		else if (minValue && minValue !== 'any' && maxValue && maxValue !== 'any') {
			const numericMinValue = parseFloat(minValue);
			const numericMaxValue = parseFloat(maxValue);
			if (isNaN(numericMinValue) || isNaN(numericMaxValue)) return;

			// If min and max are the same, use equals operator
			if (numericMinValue === numericMaxValue) {
				conditions = [
					{
						type: 'number',
						operator: 'equals',
						value: numericMinValue
					}
				];
			} else {
				conditions = [
					{
						type: 'number',
						operator: 'between',
						value: numericMinValue,
						maxValue: numericMaxValue
					}
				];
			}
		}

		// Remove any existing filter for this column
		filterState.filters = filterState.filters.filter(
			(filter: ColumnFilter) => filter.columnId !== columnName
		);

		// Add the filter
		if (conditions.length > 0) {
			filterState.filters.push({
				columnId: columnName,
				conditions
			});
			filterState.active = true;
		}

		// Close the dropdown
		onClose();
	}
</script>

<div class="w-full space-y-4 p-4">
	{#if data}
		<Histogram
			{data}
			column={columnName}
			min={minValue ? parseFloat(minValue) : undefined}
			max={maxValue ? parseFloat(maxValue) : undefined}
		/>
	{/if}

	<div class="flex gap-4">
		<div class="flex-1 flex-col space-y-2">
			<Label class="text-accent-foreground text-right text-xs">Minimum</Label>
			<Input
				type="number"
				bind:value={minValue}
				placeholder="any"
				class="no-spinners w-full"
				bind:ref={minInputRef}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						applyFilter();
					}
				}}
				oninput={() => {
					if (minValue && maxValue && parseFloat(minValue) > parseFloat(maxValue)) {
						maxValue = minValue;
					}
				}}
			/>
		</div>

		<div class="flex-1 flex-col space-y-2">
			<Label class="text-accent-foreground text-right text-xs">Maximum</Label>
			<Input
				type="number"
				bind:value={maxValue}
				placeholder="any"
				class="no-spinners w-full"
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						applyFilter();
					}
				}}
				oninput={() => {
					if (minValue && maxValue && parseFloat(maxValue) < parseFloat(minValue)) {
						minValue = maxValue;
					}
				}}
			/>
		</div>
	</div>

	<div class="flex justify-end gap-2 pt-2">
		<Button variant="outline" size="sm" class="w-full" onclick={applyFilter}>Apply</Button>
	</div>
</div>
