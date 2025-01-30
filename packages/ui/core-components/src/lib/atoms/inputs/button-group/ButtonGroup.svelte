<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { presets, setButtonGroupContext } from './lib.js';
	import { writable, readonly } from 'svelte/store';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { setContext } from 'svelte';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import Info from '../../../unsorted/ui/Info.svelte';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
	import { page } from '$app/stores';
	import HiddenInPrint from '../shared/HiddenInPrint.svelte';
	import QueryLoad from '$lib/atoms/query-load/QueryLoad.svelte';
	import { getThemeStores } from '../../../themes/themes.js';
	import InlineError from '../InlineError.svelte';
	import checkRequiredProps from '../checkRequiredProps.js';

	/** @type {string | undefined} */
	export let name = undefined;
	/** @type {string | undefined} */
	export let title = undefined;
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

	/** @type {string | undefined} */
	export let description = undefined;

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

	/** @type {[string] | [] } */
	let errors = [];

	const { results, update } = buildReactiveInputQuery(
		{ value, data, label, order, where },
		`ButtonGroup-${name}`,
		$page?.data?.data[`ButtonGroup-${name}_data`]
	);
	$: update({ value, data, label, order, where });

	$: ({ hasQuery, query } = $results);

	function validateConfiguration(preset, display) {
		const checks = [
			{ value: preset, type: 'string', options: Object.keys(presets), name: 'preset' },
			{ value: display, type: 'string', options: ['tabs', 'buttons'], name: 'display' }
		];

		checks.forEach((check) => {
			if (check.value) {
				if (typeof check.value !== check.type) {
					errors.push(
						`Invalid type: ${check.name} must be a ${check.type}. ${check.name} is type ${typeof check.value}`
					);
				}
				if (!check.options.includes(check.value)) {
					errors.push(
						`Invalid ${check.name}: ${check.value}. Expected one of the following: ${check.options.join(', ')}`
					);
				}
			}
		});
	}

	$: if ($query?.error) {
		errors.push($query.error);
	}

	if (!value) {
		if (data) {
			errors.push('Missing required prop: "value".');
		} else if (!$$slots.default && !preset) {
			errors.push('ButtonGroup requires either "value" and "data" props or <ButtonGroupItem />.');
		}
	}

	if (data) {
		if (typeof data !== 'object') {
			if (typeof data === 'string') {
				errors.push(
					`'${data}' is not a recognized query result. Data should be provided in the format: data = {'${data.replace('data.', '')}'}`
				);
			} else {
				errors.push(
					`'${data}' is not a recognized query result. Data should be an object. e.g data = {QueryName}`
				);
			}
		}
	}

	validateConfiguration(preset, display);
	try {
		checkRequiredProps({ name });
	} catch (err) {
		errors.push(err.message);
	}
</script>

{#if errors.length > 0}
	<InlineError inputType="ButtonGroup" error={errors} height="32" width="170" />
{:else}
	<HiddenInPrint enabled={hideDuringPrint}>
		<div
			class={display === 'tabs'
				? ''
				: `inline-block overflow-scroll no-scrollbar align-bottom w-fit max-w-full flex-col ${title ? 'mt-0.5' : 'mt-2'} mb-3 ml-0 mr-2`}
		>
			{#if title}
				<span class="text-xs font-medium text-base-content block mb-0.5"
					>{title}
					{#if description}
						<Info {description} />
					{/if}
				</span>
			{/if}
			<div
				class={display === 'tabs'
					? 'my-6 flex flex-wrap gap-x-1 gap-y-1'
					: 'inline-flex rounded-md shadow-sm overflow-auto border border-base-300 no-scrollbar h-8 mb-1'}
				role="group"
			>
				{#if preset}
					{#each presets[preset] as { value, valueLabel }}
						<ButtonGroupItem {value} {valueLabel} color={colorStore} {display} {defaultValue} />
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
										data={loaded}
										{value}
										valueLabel={label}
										color={colorStore}
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
