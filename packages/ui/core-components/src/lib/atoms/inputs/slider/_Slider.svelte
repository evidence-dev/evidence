<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	const inputs = getInputContext();
	import SliderShadcn from '../../shadcn/slider/sliderShadcn.svelte';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import Info from '../../../unsorted/ui/Info.svelte';
	import {
		formatValue,
		getFormatObjectFromString
	} from '@evidence-dev/component-utilities/formatting';
	import { toNumber, toBoolean } from '$lib/utils.js';
	import InlineError from '../InlineError.svelte';
	import checkRequiredProps from '../checkRequiredProps.js';
	import checkInputs from '@evidence-dev/component-utilities/checkInputs';
	import { onMount } from 'svelte';

	/////
	// Component Things
	/////

	/** @type {string} */
	export let title;

	/** @type {string} */
	export let name;

	/** @type {number} */
	export let min = 0;

	/** @type {number} */
	export let max = 100;

	/** @type {number} */
	export let step = 1;

	/** @type {boolean} */
	export let showMaxMin = true;
	$: showMaxMin = toBoolean(showMaxMin);

	/** @type {boolean} */
	export let hideDuringPrint = true;
	$: hideDuringPrint = toBoolean(hideDuringPrint);

	/** @type {number} */
	export let defaultValue;

	/** @type {string | undefined} */
	export let range = undefined;

	/** @type {[number]} */
	let value = [0];

	/** @type {string | undefined} */
	export let fmt = 'num0';

	/** @type {string} */
	export let size = '';

	/** @type {string} */
	let format_object;

	/** @type {string | undefined} */
	export let description = undefined;

	export let data;
	//let users create columns with a single row to be used for min and max
	/** @type {string | undefined} */
	export let maxColumn = undefined;
	/** @type {string | undefined} */
	export let minColumn = undefined;

	/** @type {number} */
	export let debounceDelay = 0;

	/** @type {boolean} */
	export let showInput = false;
	$: showInput = toBoolean(showInput);

	let errors = [];
	let debounceTimer;
	let initialLoad = true;
	// Debounce function to delay updates
	function debounceUpdate(newValue) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			$inputs[name] = newValue;
		}, debounceDelay);
	}

	// Clean up timer on component destruction
	onMount(() => {
		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});

	function validateNumber(value, valueType) {
		value = toNumber(value);
		if (isNaN(value)) {
			errors.push(`${valueType} must be a number`);
			return undefined;
		}
		return value;
	}

	function checkMinMax(min, max) {
		if (min > max) {
			errors.push('min cannot be greater than max');
		}
	}

	$: if (min !== undefined) {
		min = validateNumber(min, 'min');
	}
	$: if (max !== undefined) {
		max = validateNumber(max, 'max');
	}
	$: if (max !== undefined && min !== undefined) {
		checkMinMax(min, max);
	}

	// Initialize default value only once
	let defaultValueInitialized = false;
	$: if (defaultValue !== undefined && !data && !defaultValueInitialized) {
		defaultValue = validateNumber(defaultValue, 'defaultValue');
		if (defaultValue < min) {
			errors.push('defaultValue cannot be less than min');
		} else if (defaultValue > max) {
			errors.push('defaultValue cannot be greater than max');
		}
		value = [defaultValue];
		defaultValueInitialized = true;
	}

	$: if (value && value.length > 0) {
		if (initialLoad) {
			$inputs[name] = value;
			initialLoad = false;
		} else {
			debounceUpdate(value);
		}
	}

	const renderSize = (size) => {
		const sizeMap = {
			small: 'w-40',
			medium: 'w-64',
			large: 'w-96',
			//Full size width requires calc to compensate for shifted range span in sliderShadcn
			full: 'w-[calc(100%-0.6rem)]'
		};
		return sizeMap[size.toLowerCase()] || 'w-40';
	};

	$: sizeClass = renderSize(size);

	$: if (fmt) format_object = getFormatObjectFromString(fmt, 'number');
	else format_object = undefined;

	if (data) {
		try {
			checkInputs(data, [], [range, defaultValue, minColumn, maxColumn]);
		} catch (e) {
			errors = [...errors, e.message];
		}
		// sets the value to the first row of a specified column: this was a user requested added feature
		// Now looking at it seems strange
		if (typeof defaultValue === 'string' && data[0]?.[defaultValue]) {
			value = [data[0][defaultValue]];
		}
		//set min and max based on column name
		if (range) {
			min = data.map((d) => d[range]).reduce((a, b) => Math.min(a, b));
			max = data.map((d) => d[range]).reduce((a, b) => Math.max(a, b));
		}

		//if user supplies max and min cols, use them
		if (maxColumn && data[0]?.[maxColumn]) {
			max = data[0][maxColumn];
		}
		if (minColumn && data[0]?.[minColumn]) {
			min = data[0][minColumn];
		}
	}

	try {
		checkRequiredProps({ name });
	} catch (err) {
		errors.push(err.message);
	}

	// handle steps, slider lags when there are greater then 1000 steps/ticks between max and min
	$: sliderTicks = max - min;
	$: minStep = sliderTicks / 1000;
	const handleSteps = () => {
		if (sliderTicks > 1000 && step < minStep) {
			step = minStep;
		}
	};

	$: if (sliderTicks > 1000) {
		handleSteps();
	}

	// Create a reactive input value
	$: inputValue = value && value.length > 0 ? Math.round(value[0]) : min;

	// Handle input value changes
	function handleInputChange(inputValue, eventTarget = null) {
		const newValue = Math.round(inputValue);
		const validValue = Math.max(min, Math.min(max, isNaN(newValue) ? min : newValue));
		
		if (eventTarget) {
			eventTarget.value = validValue;
		}
		
		value = [validValue];
		debounceUpdate(value);
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' || e.key === 'Tab') {
			handleInputChange(e.target.value, e.target);
			e.target.blur();
		}
	}
</script>

<HiddenInPrint enabled={hideDuringPrint}>
	{#if errors.length > 0}
		<InlineError inputType="Slider" error={errors} width="170" height="36" />
	{:else}
		<div class={`relative ${sizeClass} mt-2 mb-10 select-none`}>
			<p class="pb-2 truncate text-xs">
				<span class="font-medium">
					{#if description}
						{title}<Info {description} className="mr-2" />
					{:else}
						{title}:
					{/if}
				</span>
				{#if showInput}
					<input
						type="number"
						min={min}
						max={max}
						value={inputValue}
						class="w-auto h-8 px-2 mb-2 text-sm border border-base-300 rounded bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
						
						on:keydown={handleKeydown}
					/>
				{:else}
					<span class="text-xs">
						{fmt ? formatValue($inputs[name], format_object) : $inputs[name]}
					</span>
				{/if}
			</p>
			<SliderShadcn {min} {max} {step} {sizeClass} bind:value />
			{#if showMaxMin}
				<span class="absolute left-0 text-xs pt-1 -z-10"
					>{fmt ? formatValue(min, format_object) : min}</span
				>
				<span class="absolute -right-2.5 text-xs pt-1 -z-10"
					>{fmt ? formatValue(max, format_object) : max}</span
				>
			{/if}
		</div>
	{/if}
</HiddenInPrint>
