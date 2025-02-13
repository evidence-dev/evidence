<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// @ts-check

	import VariableCopy from './VariableCopy.svelte';

	/** @type {{ gitRepo?: string }} */
	export let settings;

	/** @type {unknown[]} */
	export let sources;
</script>

{#if !sources.length}
	<p class="text-sm py-2">
		You'll need to connect to at least one datasource before deploying to netlify.
	</p>
{:else if !settings.gitRepo}
	<p class="text-sm py-2">You'll need to set up a git repo before deploying to netlify.</p>
{:else}
	<h2 class="font-semibold text-lg pt-3 pb-2">Deploying to Netlify</h2>

	<ol>
		<li>
			<a
				class="text-primary hover:brightness-110 active:brightness-90 transition"
				href="https://app.netlify.com/start"
				target="_blank"
				rel="noreferrer">Start a new netlify project &rarr;</a
			>
		</li>
		<li>Choose the repo containing this project</li>
		<li>Update the <code>site settings</code> to match those below</li>
	</ol>

	<div class="separator">Basic Build Settings</div>

	<div class="setting-row">
		<span class="setting">Build command</span>
		<div class="setting-value"><VariableCopy text={'npm run sources && npm run build'} /></div>
	</div>

	<div class="setting-row">
		<span class="setting">Publish directory</span>
		<div class="setting-value"><VariableCopy text={'build/'} /></div>
	</div>

	<div class="separator">Advanced Build Settings</div>
	<p class="text-sm py-2">
		Click 'Show Advanced' add your
		<a
			class="text-primary hover:brightness-110 active:brightness-90 transition"
			href="https://docs.netlify.com/configure-builds/environment-variables/"
			target="_blank"
			rel="noreferrer"
		>
			environment variables.
		</a>
	</p>
{/if}

<style>
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
