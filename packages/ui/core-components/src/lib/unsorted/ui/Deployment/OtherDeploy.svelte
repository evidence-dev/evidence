<script>
	import VariableCopy from './VariableCopy.svelte';
</script>

<h2>Deploying your Project</h2>

<p>In production, Evidence functions like a static site generator:</p>
<ol>
	<li>
		Running <code>npm run build</code> will build a static site in the <code>/build</code> directory using
		the credentials in the datasource connections panel, which you can host in a variety of environments
	</li>
</ol>

<div class="separator">Building Your Project</div>

<div class="setting-row">
	<span class="setting">Build command</span>
	<div class="setting-value"><VariableCopy text={'npm run sources && npm run build'} /></div>
</div>

<div class="setting-row">
	<span class="setting">Publish directory</span>
	<div class="setting-value"><VariableCopy text={'build/'} /></div>
</div>

<style>
	h2 {
		@apply font-semibold text-lg pt-3 pb-2;
	}

	p {
		@apply text-sm py-2;
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
