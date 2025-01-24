<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check

	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import EvidenceDeploy from './EvidenceDeploy.svelte';
	import NetlifyDeploy from './NetlifyDeploy.svelte';
	import VercelDeploy from './VercelDeploy.svelte';
	import OtherDeploy from './OtherDeploy.svelte';
	import EnvironmentVarListing from './EnvironmentVarListing.svelte';
	import { slide } from 'svelte/transition';

	/** @type {{ gitRepo?: string }}*/
	export let settings;

	/** @type {DatasourceSpec[]} */
	export let sources;

	/** @typedef {typeof import('svelte').SvelteComponent<{ settings?: { gitRepo?: string }; sources?: unknown }>} FormComponent */
	/** @type {{ id: string; name: string; FormComponent: FormComponent }[]} */
	let deploymentOptions = [
		{ id: 'evidence', name: 'Evidence Cloud', FormComponent: EvidenceDeploy },
		{ id: 'netlify', name: 'Netlify', FormComponent: NetlifyDeploy },
		{ id: 'vercel', name: 'Vercel', FormComponent: VercelDeploy },
		{ id: 'other', name: 'Self-host (other)', FormComponent: OtherDeploy }
	];

	let selectedDeployment = deploymentOptions[0];
</script>

<form id="deploy">
	<div class="deploy-settings-box">
		<div class="panel">
			<h2 class="font-semibold text-lg pt-3 pb-2">Deployment</h2>
			<p class="text-sm py-2">
				Evidence projects can be deployed to a variety of cloud environments. The easiest way to
				deploy your project is with <b>Evidence Cloud</b>.
			</p>
			<h3 class="uppercase text-sm leading-loose mt-6 mb-1">Environment Variables</h3>
			<div>
				<EnvironmentVarListing {sources} />
			</div>

			<h3 class="uppercase text-sm leading-loose mt-6 mb-1">Deployment Environment</h3>
			<select
				bind:value={selectedDeployment}
				class="mb-2 hover:shadow-md hover:border-base-content"
			>
				{#each deploymentOptions as option}
					<option value={option}>
						{option.name}
					</option>
				{/each}
			</select>
		</div>
		{#if selectedDeployment.FormComponent}
			<div class="panel" transition:slide|local>
				<svelte:component this={selectedDeployment.FormComponent} {settings} {sources} />
			</div>
		{/if}
	</div>
	<footer>
		<span
			>Learn more about <a
				class="docs-link text-primary hover:brightness-110 active:brightness-90 transition"
				target="_blank"
				rel="noreferrer"
				href="https://docs.evidence.dev/deployment/overview">Deploying your Project &rarr;</a
			></span
		>
	</footer>
</form>

<style>
	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		padding: 0.35em;
		width: 100%;
		border: 1px solid var(--base-300);
		font-family: var(--ui-font-family);
		background: var(--base-200);
		margin: 0.5em 0 0 0;
		transition: all 400ms;
		cursor: pointer;
	}

	select:hover {
		transition: all 400ms;
	}

	select:focus {
		outline: none;
	}

	form {
		scroll-margin-top: 3.5rem; /* offset for sticky header */
	}
	.deploy-settings-box {
		margin-top: 2em;
		border-top: 1px solid var(--base-300);
		border-left: 1px solid var(--base-300);
		border-right: 1px solid var(--base-300);
		border-radius: 5px 5px 0 0;
		font-size: 14px;
		font-family: var(--ui-font-family);
		min-width: 100%;
	}

	.panel {
		border-top: 1px solid var(--base-300);
		padding: 0em 1em 1em 1em;
	}

	.panel:first-of-type {
		border-top: none;
	}

	footer {
		border: 1px solid var(--base-300);
		border-radius: 0 0 5px 5px;
		background-color: var(--base-200);
		padding: 1em;
		display: flex;
		font-size: 14px;
		align-items: center;
		font-family: var(--ui-font-family);
	}
</style>
