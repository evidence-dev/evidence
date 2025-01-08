<script>
	// @ts-check
	import { fly, blur } from 'svelte/transition';

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import { Icon } from '@steeze-ui/svelte-icon';
	import * as simpleIcons from '@steeze-ui/simple-icons';
	import * as evidenceIcons from '@evidence-dev/icons';
	import { Plus, Database, CircleCheck } from '@evidence-dev/component-utilities/icons';

	import { createEventDispatcher } from 'svelte';
	import SourceConfigForm from './SourceConfigForm.svelte';
	import { Button } from '../../atoms/button/index.js';
	import * as Select from '../../atoms/shadcn/select/index.js';

	import SourceNameField, { validateName } from './atoms/SourceNameField.svelte';

	export let addingSource;
	export let availablePackages;

	export let sourcePlugin;
	export let availableSourcePlugins;

	/** @type {Pick<DatasourceSpec, 'name' | 'type'>[]} */
	export let sources = [];

	/** @type {any} */
	let newSourceType = {};
	let newSourceName = '';

	$: source = {
		name: newSourceName,
		type: newSourceType?.value,
		options: {},
		environmentVariables: {}
	};

	let configuring = false;
	let sourceAdded = false;

	$: sourcePlugin = availableSourcePlugins?.[source?.type];

	let nameError = '';

	const dispatch = createEventDispatcher();

	function submit() {
		if (!newSourceType?.value) {
			return;
		}
		nameError = validateName(newSourceName, sources);
		if (nameError) return;

		configuring = true;
	}

	function newSourceAdded(e) {
		sourceAdded = true;
		dispatch('newSource', e.detail);
	}

	function dismiss() {
		addingSource = false;
	}

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

<div>
	{#if sourceAdded}
		<div class=" flex flex-col gap-8 items-center p-2" in:fly|local={{ x: 50, duration: 300 }}>
			<div class="flex flex-col items-center gap-2">
				<Icon src={CircleCheck} class="text-positive/90 h-14 w-14" />
				<div class="flex flex-col items-center text-sm">
					<p class="font-semibold text-base-content mb-4 text-lg">Connected</p>
					<p class="text-base-content">
						Add files to <code class="text-sm bg-base-200 px-1.5 py-0.5 rounded border font-mono"
							>sources/{source.name}</code
						> in order to query this source.
					</p>
				</div>
			</div>
			<Button variant="primary" on:click={dismiss} size="lg">Done</Button>
		</div>
	{:else if !configuring}
		<h3 class="font-semibold text-base-content flex items-center gap-2 mb-4">
			<Icon src={Plus} class="w-4 h-4" />
			<span>New Source</span>
		</h3>
		<div in:fly|local={{ x: -50, duration: 300 }}>
			<form class="flex flex-col w-full gap-4" on:submit|preventDefault={submit}>
				<label for="sourceType" class="font-medium text-sm flex flex-col gap-2">
					Source Type
					<Select.Root bind:selected={newSourceType} required name="sourceType">
						<Select.Trigger>
							<div class:border-negative={!newSourceType?.value}>
								<span>
									{newSourceType?.value ?? ''}
								</span>
							</div>
						</Select.Trigger>
						<Select.Content>
							{#each Object.entries(availablePackages) as [name, value]}
								{@const supports = value.package.package.evidence.datasources}
								{#each supports as db}
									{#if Array.isArray(db)}
										{#if db.length}
											{@const dbIconName = value.package.package.evidence.icon}
											<Select.Item value={db[0]}>
												<div class="flex items-center gap-4">
													<div class="text-base-content">
														{#if isSimpleIcon(dbIconName)}
															<Icon src={simpleIcons[dbIconName]} class="w-5 h-5" />
														{:else if isEvidenceIcon(dbIconName)}
															<Icon src={evidenceIcons[dbIconName]} class="w-5 h-5" />
														{:else}
															<Icon src={Database} class="w-5 h-5" />
														{/if}
													</div>
													<div class="flex flex-col">
														<div>
															{db[0]}
														</div>
														<div class="font-light text-base-content-muted/70 text-xs">
															{name}
														</div>
													</div>
												</div>
											</Select.Item>
										{:else}
											<!-- This is a misconfiguratino of the datasource package -->
										{/if}
									{:else}
										{@const dbIconName = value.package.package.evidence.icon}
										<Select.Item value={db}>
											<div class="flex items-center gap-4">
												<div class="text-base-content">
													{#if isSimpleIcon(dbIconName)}
														<Icon src={simpleIcons[dbIconName]} class="w-5 h-5" />
													{:else if isEvidenceIcon(dbIconName)}
														<Icon src={evidenceIcons[dbIconName]} class="w-5 h-5" />
													{:else}
														<Icon src={Database} class="w-5 h-5" />
													{/if}
												</div>
												<div class="flex flex-col">
													<div>
														{db}
													</div>
													<div class="font-light text-base-content-muted/70 text-xs">
														{name}
													</div>
												</div>
											</div>
										</Select.Item>
									{/if}
								{/each}
							{/each}
						</Select.Content>
						<Select.Input />
					</Select.Root>
				</label>

				<div>
					<SourceNameField bind:sourceName={newSourceName} bind:nameError showPrefix={true} />
				</div>

				<div class="flex justify-end gap-2">
					<Button variant="ghost" on:click={() => (addingSource = false)}>Cancel</Button>
					<Button type="submit" disabled={!newSourceType?.value || !newSourceName}
						>Next &rarr;</Button
					>
				</div>
			</form>
		</div>
	{:else}
		<div class="flex items-center gap-4">
			<div class="text-base-content h-full">
				{#if isSimpleIcon(iconName)}
					<Icon src={simpleIcons[iconName]} class="w-6 h-6" />
				{:else if isEvidenceIcon(iconName)}
					<Icon src={evidenceIcons[iconName]} class="w-6 h-6" />
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
			</div>
		</div>
		<div in:fly|local={{ x: 100, duration: 300 }}>
			<SourceConfigForm
				{sources}
				{sourcePlugin}
				{source}
				isNewSource={true}
				on:sourceUpdated={(e) => newSourceAdded(e)}
				on:cancel={() => (configuring = false)}
			/>
		</div>
	{/if}
</div>
