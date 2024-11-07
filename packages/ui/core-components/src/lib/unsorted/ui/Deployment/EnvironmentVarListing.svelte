<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import { Accordion, AccordionItem } from '$lib/atoms/accordion';
	import VariableCopy from './VariableCopy.svelte';

	import { toasts } from '@evidence-dev/component-utilities/stores';
	import { Button } from '$lib/atoms/button';
	import { Clipboard } from '@evidence-dev/component-utilities/icons';

	/** @type {DatasourceSpec[]} */
	export let datasourceSettings;

	let credentials = {};

	function copyVars() {
		const vars = datasourceSettings.reduce((a, v) => {
			return [
				a,
				Object.entries(v.environmentVariables)
					.map(([k, v]) => `${k}="${v.replace(/\\n/g, '\n')}"`)
					.join('\n')
			].join('\n');
		}, '');
		navigator.clipboard.writeText(vars);
		toasts.add({
			title: '',
			status: 'success',
			message: 'Copied environment variables to clipboard'
		});
	}
</script>

<p>
	To use different data environments in production vs development,
	<a class="docs-link" href="https://docs.evidence.dev/deployment/environments">
		use different environment variable values.
	</a>
</p>

{#if credentials.authenticator === 'externalbrowser'}
	<hr />
	<p>
		External browser authentication isn't supported in cloud deployments, as it needs access to a
		browser. Set up one of the other authentication options for a deployment.
	</p>
{:else if credentials.authenticator === 'gcloud-cli'}
	<hr />
	<p>
		GCloud authentication isn't supported in cloud deployments, as it needs access to a browser. Set
		up one of the other authentication options for a deployment.
	</p>
{:else}
	<Accordion>
		<AccordionItem title="All Environment Variables">
			<div class="w-full flex justify-end items-center my-1 mb-2">
				<Button on:click={copyVars} type="button" outline icon={Clipboard} size="sm">
					Copy All
				</Button>
			</div>

			<div class="titles">
				<span class="title">Key</span><span class="title">Value</span>
			</div>
			{#each datasourceSettings as datasource}
				{#each Object.entries(datasource.environmentVariables) as [key, value]}
					<div class="environment-variable">
						<div class="var-name">
							<VariableCopy text={key} />
						</div>
						<div class="var-value">
							<VariableCopy text={value} hideText={true} />
						</div>
					</div>
				{/each}
			{/each}
		</AccordionItem>
	</Accordion>
{/if}

<style>
	div.environment-variable {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-bottom: 1.25em;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	div.titles {
		font-family: var(--ui-font-family);
		color: var(--grey-999);
		font-size: 16px;
		margin-bottom: 0.25em;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	div.var-value {
		margin-left: auto;
		width: 45%;
	}

	div.var-name {
		width: 45%;
	}

	span.title {
		width: 45%;
		font-size: 0.85em;
		color: var(--grey-800);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.docs-link {
		color: var(--blue-600);
		text-decoration: none;
	}

	.docs-link:hover {
		color: var(--blue-800);
	}
</style>
