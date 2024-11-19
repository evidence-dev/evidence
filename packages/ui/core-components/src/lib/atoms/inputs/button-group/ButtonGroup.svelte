<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { presets, setButtonGroupContext } from './lib.js';
	import { writable, readonly } from 'svelte/store';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { setContext } from 'svelte';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import ErrorChart from '../../../unsorted/viz/core/ErrorChart.svelte';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { page } from '$app/stores';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import QueryLoad from '$lib/atoms/query-load/QueryLoad.svelte';
	import { getThemeStores } from '../../../themes/themes.js';
	/** @type {string} */
	export let name;
	/** @type {string} */
	export let title;
	/** @type {boolean} */
	export let hideDuringPrint = true;

	/** @type {keyof typeof presets | undefined} */
	export let preset = undefined;

	const inputs = getInputContext();
	// for Tabs styling
	/** @type {'tabs' | 'buttons'} */
	export let display = 'buttons';

	/** @type {string | undefined} */
	export let defaultValue = undefined;

	setContext('button-display', display);

	const { resolveColor } = getThemeStores();

	export let color = 'hsla(207, 65%, 39%, 1)';
	$: colorStore = resolveColor(color);

	const valueStore = writable(null);

	// TODO: Use getInputSetter instead
	setButtonGroupContext((v) => {
		$valueStore = v;
		// the assignment to $inputs is necessary to trigger the change on SSR
		$inputs[name] = v?.value ?? null;
	}, readonly(valueStore));

	/////
	// Query-Related Things
	/////

	export let value, data, label, order, where;

	const { results, update } = buildReactiveInputQuery(
		{ value, data, label, order, where },
		`ButtonGroup-${name}`,
		$page?.data?.data[`ButtonGroup-${name}_data`]
	);
	$: update({ value, data, label, order, where });

	$: ({ hasQuery, query } = $results);

	/** @type {string} */
	let error = '';

	function validateConfiguration(preset, display) {
		error = '';
		const checks = [
			{ value: preset, type: 'string', options: Object.keys(presets), name: 'preset' },
			{ value: display, type: 'string', options: ['tabs', 'buttons'], name: 'display' }
		];

		checks.forEach((check) => {
			if (check.value) {
				if (typeof check.value !== check.type) {
					appendError(
						`Invalid type: ${check.name} must be a ${check.type}. ${check.name} is type ${typeof check.value}`
					);
				}
				if (!check.options.includes(check.value)) {
					appendError(
						`Invalid ${check.name}: ${check.value}. Expected one of the following: ${check.options.join(', ')}`
					);
				}
			}
		});

		function appendError(message) {
			if (error) error += ', ';
			error += message;
		}
	}

	validateConfiguration(preset, display);
</script>

{#if error}
	<ErrorChart chartType={'Button Group'} {error} />
{:else}
	<HiddenInPrint enabled={hideDuringPrint}>
		<div
			class={display === 'tabs' ? '' : 'inline-flex w-fit max-w-full flex-col mt-2 mb-4 ml-0 mr-2'}
		>
			{#if title}
				<span class="text-sm block mb-1">{title}</span>
			{/if}
			<div
				class={display === 'tabs'
					? 'my-6 flex flex-wrap gap-x-1 gap-y-1'
					: 'inline-flex rounded-md shadow-sm shadow-base-100 overflow-auto h-8 border border-base-300 no-scrollbar'}
				role="group"
			>
				{#if preset}
					{#each presets[preset] as { value, valueLabel }}
						<ButtonGroupItem {value} {valueLabel} color={$colorStore} {display} {defaultValue} />
					{/each}
				{:else}
					<slot {display} />
					{#if hasQuery}
						<QueryLoad data={query} let:loaded>
							<svelte:fragment slot="skeleton">
								<div class="h-8 min-w-24 w-full max-width-24 block animate-pulse bg-base-300" />
							</svelte:fragment>
							<svelte:fragment>
								{#each loaded as { label, value }}
									<ButtonGroupItem
										{value}
										valueLabel={label}
										color={$colorStore}
										{display}
										{defaultValue}
									/>
								{/each}
							</svelte:fragment>
						</QueryLoad>
					{/if}
				{/if}
			</div>
		</div>
	</HiddenInPrint>
{/if}
