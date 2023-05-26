<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import EnvironmentVarListing from './EnvironmentVarListing.svelte';
	import VariableCopy from './VariableCopy.svelte';
	export let settings;
</script>

<h2>Deploying your Project</h2>

<p>In production, Evidence functions like a static site generator:</p>
<ol>
	<li>
		Running <code>npm run build</code> will build a static site in the <code>/build</code> directory
		using the credentials in the database connections panel, which you can host in a variety of environments
	</li>
	<li>
		You can share your database credentials with your production environment by setting the
		environment variables listed below
	</li>
</ol>

<div class="separator">Building Your Project</div>

<div class="setting-row">
	<span class="setting">Build command</span>
	<div class="setting-value"><VariableCopy text={'npm run build'} /></div>
</div>

<div class="setting-row">
	<span class="setting">Publish directory</span>
	<div class="setting-value"><VariableCopy text={'build/'} /></div>
</div>

<div class="separator">Environment Variables</div>
<p>
	The following environment variables must be present in your deployment environment to enable your
	database connection
</p>

{#if !settings.credentials}
	<p>Your project does not have a database connection.</p>
{:else}
	<EnvironmentVarListing {settings} />
{/if}

<style>
	span.setting {
		font-size: 0.85em;
		color: var(--grey-800);
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
		color: var(--grey-700);
		font-weight: bold;
	}

	.separator::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid var(--grey-200);
	}

	.separator:not(:empty)::after {
		margin-left: 1.5em;
		margin-top: 0.1em;
	}
</style>
