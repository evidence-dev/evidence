<script>
	// @ts-check

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */
	/** @typedef {{ package: { package: import('@evidence-dev/sdk/plugins').DatasourcePackage } }} DatasourcePlugin */

	import { slide } from 'svelte/transition';

	import { Icon } from '@steeze-ui/svelte-icon';
	import * as simpleIcons from '@steeze-ui/simple-icons';
	import * as evidenceIcons from '@evidence-dev/icons';
	import { Button } from '../../atoms/button/index.js';

	import { Database, ExclamationCircle } from '@steeze-ui/tabler-icons';
	import SourceConfigForm from './SourceConfigForm.svelte';

	/** @type {Pick<DatasourceSpec, 'name' | 'type' >} */
	export let source;

	/** @type {Pick<DatasourceSpec, 'name' | 'type'>[]} */
	export let sources;

	/** @type {Record<string, DatasourcePlugin>} */
	export let availableSourcePlugins;

	let open = false;

	$: sourcePlugin = availableSourcePlugins?.[source.type];

	$: iconName = sourcePlugin?.package.package.evidence.icon;

	/**
	 * @param {string | undefined} iconName
	 * @returns {iconName is keyof typeof simpleIcons}
	 */
	const isSimpleIcon = (iconName) => typeof iconName !== 'undefined' && iconName in simpleIcons;

	/**
	 * @param {string | undefined} iconName
	 * @returns {iconName is keyof typeof evidenceIcons}
	 */
	const isEvidenceIcon = (iconName) => typeof iconName !== 'undefined' && iconName in evidenceIcons;
</script>

<div class="border-b border-base-300 last:border-b-0 p-4">
	<div class="flex items-center gap-4">
		<div class="text-base-content h-full">
			{#if isSimpleIcon(iconName)}
				<Icon src={simpleIcons[iconName]} class="w-6 h-6" />
			{:else if isEvidenceIcon(iconName)}
				<Icon src={evidenceIcons[iconName]} class="w-6 h-6" />
			{:else if !sourcePlugin}
				<Icon src={ExclamationCircle} class="w-6 h-6 text-negative" />
			{:else}
				<Icon src={Database} class="w-6 h-6" />
			{/if}
		</div>
		<div class=" flex w-full justify-between items-center">
			<div class="flex items-center text-base-content gap-4">
				<div class="flex flex-col text-sm">
					<p class="text-base-content-muted font-mono text-xs">
						{source.type}
					</p>
					<h4 class="text-base-content font-medium">{source.name}</h4>
				</div>
			</div>
			<div class="flex justify-end gap-1">
				<Button variant="ghost" disabled={!sourcePlugin} on:click={() => (open = !open)}>
					Edit
				</Button>
			</div>
		</div>
	</div>
	{#if open}
		<div class="flex" transition:slide|local>
			<SourceConfigForm
				{sources}
				{source}
				{sourcePlugin}
				on:sourceUpdated={(e) => (source = e.detail)}
			/>
		</div>
	{/if}
</div>
