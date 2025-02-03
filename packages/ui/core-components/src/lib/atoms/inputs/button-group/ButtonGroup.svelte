<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { page } from '$app/stores';
	import { hydrateFromUrlParam, updateUrlParam } from '@evidence-dev/sdk/utils/svelte';
	import { presets, setButtonGroupContext } from './lib.js';
	import { writable, readonly } from 'svelte/store';
	import { getInputContext } from '@evidence-dev/sdk/utils/svelte';
	import { setContext } from 'svelte';
	import { buildReactiveInputQuery } from '@evidence-dev/component-utilities/buildQuery';
	import Info from '../../../unsorted/ui/Info.svelte';
	import ButtonGroupItem from './ButtonGroupItem.svelte';
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

	// $: if($page.url.searchParams.has(name)){
	// 	defaultValue = $page.url.searchParams.get(name);
	// }

	setContext('button-display', display);

	const { resolveColor } = getThemeStores();

	export let color = 'hsla(207, 65%, 39%, 1)';
	$: colorStore = resolveColor(color);

	/** @type {string | undefined} */
	export let description = undefined;

	const valueStore = writable(null);

	hydrateFromUrlParam(name, (v) => (defaultValue = v));

	// 	function updateSearchParams(key, value) {
	// 		if(browser && key){
	//     // Clone the current URL using $page
	//     const url = $page.url;

	// 	if(!value || value === ''){
	// 		url.searchParams.delete(key);
	// 		history.replaceState(null, "", `?${url.searchParams.toString()}`);
	// 		return;
	// 	}

	// 	 if(!url.searchParams.has(key)){
	// 		url.searchParams.append(key, value);
	// 		history.replaceState(null, "", `?${url.searchParams.toString()}`);
	// 	 } else if (url.searchParams.get(key) !== value) {
	//         url.searchParams.set(key, value);

	//         // Update the URL
	//         // goto(`${url.pathname}?${url.searchParams.toString()}`, { replaceState: true, noScroll: true, keepFocus: true });
	// 		// replaceState($page.url, $page.state)
	// 		history.replaceState(null, "", `?${url.searchParams.toString()}`);
	//       }
	// 		}
	//   }

	// TODO: Use getInputSetter instead
	setButtonGroupContext((v) => {
		$valueStore = v;
		// the assignment to $inputs is necessary to trigger the change on SSR
		$inputs[name] = v?.value ?? null;
		// updateSearchParams(name, v?.value);
		updateUrlParam(name, v?.value);
		// hydrateFromUrlParam(name, (newVal) => v.value = newVal)
		// if($page.url.searchParams.has(name)){
		// 	v.value = $page.url.searchParams.get(name);
		// }
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
	<span
		class="group inline-flex items-center relative cursor-help cursor-helpfont-sans px-1 border border-negative py-[1px] bg-negative/10 rounded"
	>
		<span class="inline font-sans font-medium text-xs text-negative">error</span>
		<span
			class="hidden font-sans group-hover:inline absolute -top-1 left-[105%] text-sm z-10 px-2 py-1 bg-base-200 border border-base-300 leading-relaxed min-w-[150px] w-max max-w-[400px] rounded-md"
		>
			{error}
		</span>
	</span>
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
