<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let settings;
	import EvidenceDeploy from './EvidenceDeploy.svelte';
	import NetlifyDeploy from './NetlifyDeploy.svelte';
	import VercelDeploy from './VercelDeploy.svelte';
	import OtherDeploy from './OtherDeploy.svelte';
	import { slide } from 'svelte/transition';

	let deploymentOptions = [
		{ id: 'evidence', name: 'Evidence Cloud', formComponent: EvidenceDeploy },
		{ id: 'netlify', name: 'Netlify', formComponent: NetlifyDeploy },
		{ id: 'vercel', name: 'Vercel', formComponent: VercelDeploy },
		{ id: 'other', name: 'Self-host (other)', formComponent: OtherDeploy }
	];

	let selectedDeployment = deploymentOptions[0];
</script>

<form id="deploy">
	<div class="container">
		<div class="panel">
			<h2>Deployment</h2>
			<p>
				Evidence projects can be deployed to a variety of cloud environments. The easiest way to
				deploy your project is with <b>Evidence Cloud</b>.
			</p>
			<h3>Deployment Environment</h3>
			<select bind:value={selectedDeployment}>
				{#each deploymentOptions as option}
					<option value={option}>
						{option.name}
					</option>
				{/each}
			</select>
		</div>
		{#if selectedDeployment.formComponent}
			<div class="panel" transition:slide|local>
				<svelte:component this={selectedDeployment.formComponent} {settings} />
			</div>
		{/if}
	</div>
	<footer>
		<span
			>Learn more about <a class="docs-link" href="https://docs.evidence.dev/deployment/overview"
				>Deploying your Project &rarr;</a
			></span
		>
	</footer>
</form>

<style>
	h3 {
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		font-style: normal;
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
	.container {
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
