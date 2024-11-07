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
	export let datasourceSettings;

	/** @typedef {typeof import('svelte').SvelteComponent<{ settings?: { gitRepo?: string }; datasourceSettings?: unknown }>} FormComponent */

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
			<h2>Deployment</h2>
			<p>
				Evidence projects can be deployed to a variety of cloud environments. The easiest way to
				deploy your project is with <b>Evidence Cloud</b>.
			</p>
			<h3>Environment Variables</h3>
			<div>
				<EnvironmentVarListing {datasourceSettings} />
			</div>

			<h3>Deployment Environment</h3>
			<select bind:value={selectedDeployment} class="mb-2">
				{#each deploymentOptions as option}
					<option value={option}>
						{option.name}
					</option>
				{/each}
			</select>
		</div>
		{#if selectedDeployment.FormComponent}
			<div class="panel" transition:slide|local>
				<svelte:component this={selectedDeployment.FormComponent} {settings} {datasourceSettings} />
			</div>
		{/if}
	</div>
	<footer>
		<span
			>Learn more about <a
				class="docs-link"
				target="_blank"
				rel="noreferrer"
				href="https://docs.evidence.dev/deployment/overview">Deploying your Project &rarr;</a
			></span
		>
	</footer>
</form>

<style>
	h3 {
		@apply uppercase text-sm leading-loose mt-6 mb-1;
	}

	h2 {
		@apply font-semibold text-lg pt-3 pb-2;
	}

	p {
		@apply text-sm py-2;
	}
	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		padding: 0.35em;
		width: 100%;
		border: 1px solid var(--grey-200);
		font-family: var(--ui-font-family);
		color: var(--grey-800);
		margin: 0.5em 0 0 0;
		transition: all 400ms;
		cursor: pointer;
	}

	select:hover {
		border: 1px solid var(--grey-300);
		transition: all 400ms;
		box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
	}

	select:focus {
		outline: none;
	}

	form {
		scroll-margin-top: 3.5rem; /* offset for sticky header */
	}
	.deploy-settings-box {
		margin-top: 2em;
		border-top: 1px solid var(--grey-200);
		border-left: 1px solid var(--grey-200);
		border-right: 1px solid var(--grey-200);
		border-radius: 5px 5px 0 0;
		font-size: 14px;
		font-family: var(--ui-font-family);
		min-width: 100%;
	}

	.panel {
		border-top: 1px solid var(--grey-200);
		padding: 0em 1em 1em 1em;
	}

	.panel:first-of-type {
		border-top: none;
	}

	footer {
		border: 1px solid var(--grey-200);
		border-radius: 0 0 5px 5px;
		background-color: var(--grey-100);
		padding: 1em;
		display: flex;
		font-size: 14px;
		align-items: center;
		font-family: var(--ui-font-family);
	}

	.docs-link {
		color: var(--blue-600);
		text-decoration: none;
	}

	.docs-link:hover {
		color: var(--blue-800);
	}
</style>
