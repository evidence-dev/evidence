<script>
	// @ts-check

	import VariableCopy from './VariableCopy.svelte';

	/** @type {{ gitRepo?: string }} */
	export let settings;

	/** @type {unknown[]} */
	export let sources;
</script>

{#if !sources.length}
	<p>You'll need to connect to at least one datasource before deploying to Vercel.</p>
{:else if !settings.gitRepo}
	<p>You'll need to set up a git repo before deploying to Vercel.</p>
{:else}
	<h2>Deploying to Vercel</h2>

	<ol>
		<li>
			<a href="https://vercel.com/new" target="_blank" rel="noreferrer"
				>Start a new Vercel project &rarr;</a
			>
		</li>
		<li>Choose the repo containing this project</li>
		<li>Configure your project to match the settings below</li>
	</ol>

	<div class="separator">Build and Output Settings</div>

	<div class="setting-row">
		<span class="setting">Build Command</span>
		<div class="setting-value"><VariableCopy text={'npm run sources && npm run build'} /></div>
	</div>

	<div class="setting-row">
		<span class="setting">Output Directory</span>
		<div class="setting-value"><VariableCopy text={'build/'} /></div>
	</div>

	<div class="setting-row">
		<span class="setting">Install Command</span>
		<div class="setting-value"><VariableCopy text={'npm install'} /></div>
	</div>
{/if}

<style lang="postcss">
	h2 {
		@apply font-semibold text-lg pt-3 pb-2;
	}

	p {
		@apply text-sm py-2;
	}

	a {
		@apply text-primary hover:brightness-110 active:brightness-90 transition;
	}

	span.setting {
		font-size: 0.85em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	div.setting-row {
		margin-top: 1.25em;
	}

	div.setting-row:first-of-type {
		margin-top: 0em;
	}

	div.setting-value {
		margin-top: 0.25em;
		width: 45%;
	}

	.separator {
		display: flex;
		align-items: center;
		text-align: center;
		margin-block-start: 2.5em;
		color: var(--base-content);
		font-weight: bold;
	}

	.separator::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid var(--base-300);
	}

	.separator:not(:empty)::after {
		margin-left: 1.5em;
		margin-top: 0.1em;
	}
</style>
