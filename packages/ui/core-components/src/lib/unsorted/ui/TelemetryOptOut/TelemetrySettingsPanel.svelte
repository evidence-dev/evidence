<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import CollapsibleTableSection from '../Formatting/CollapsibleTableSection.svelte';
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let settings;
	let usageStats = (settings.send_anonymous_usage_stats ?? 'yes') === 'yes';

	async function save() {
		settings.send_anonymous_usage_stats = usageStats ? 'yes' : 'no';
		await fetch(addBasePath('/api/settings.json'), {
			method: 'POST',
			body: JSON.stringify({
				settings
			})
		});
	}
</script>

<form id="telemetry">
	<div class="telemetry-settings-box">
		<div class="panel">
			<h2 class="font-semibold text-lg pt-3 pb-2">Telemetry</h2>
			<p class="text-sm py-2">
				Evidence collects anonymous usage data to help us understand how often the tool is being
				used.
			</p>
			<CollapsibleTableSection headerText="More" expanded={false}>
				<div>
					<p class="text-sm py-2">
						Each time you run a query, we get the following pieces of information:
					</p>
					<ol class="list-decimal px-8">
						<li>
							A random identifier that is stored in <code
								>.evidence/customization/.profile.json</code
							>
						</li>
						<li>
							An anonymized identifier based on the git repository you're using for the project
						</li>
						<li>Whether your project is running in development or build mode</li>
						<li>
							Whether your query returned from the cache, from your datasource, or returned an error
						</li>
						<li>
							The type of Evidence datasource connectors you are using (postgres, snowflake, etc.)
						</li>
						<li>The operating system your project is running on (windows, mac, etc.)</li>
					</ol>
					<p class="text-sm py-2">
						Sharing anonymous usage data is one of the best ways you can support Evidence.
					</p>
					<div class="input-item">
						<label for="telemetry-toggle"> Share anonymous usage data </label>
						<label class="switch">
							<input
								type="checkbox"
								bind:checked={usageStats}
								on:change={save}
								id="telemetry-toggle"
							/>
							<span class="slider before:shadow-md" />
						</label>
					</div>
				</div>
			</CollapsibleTableSection>
		</div>
	</div>
	<footer>
		<span
			>The source code for our telemetry can be <a
				class="text-primary hover:brightness-110 active:brightness-90 transition"
				href="https://github.com/evidence-dev/evidence/blob/main/packages/telemetry/index.cjs"
				target="_blank"
				rel="noreferrer">found here &rarr;</a
			></span
		>
	</footer>
</form>

<style>
	form {
		scroll-margin-top: 3.5rem; /* offset for sticky header */
	}
	.telemetry-settings-box {
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

	.switch {
		position: relative;
		display: inline-block;
		width: 2.8rem;
		height: 1.75rem;
		margin-left: auto;
		margin-right: 2px;
		user-select: none;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 25px;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 1.25rem;
		width: 1.25rem;
		left: 4px;
		bottom: 4px;
		background-color: white;
		-webkit-transition: 0.4s;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: var(--positive);
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(1.1rem);
		-ms-transform: translateX(1.1rem);
		transform: translateX(1.1rem);
	}

	label {
		width: 30%;
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		white-space: nowrap;
	}

	div.input-item {
		font-family: var(--ui-font-family);
		font-size: 16px;
		margin-top: 1.25em;
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}
</style>
