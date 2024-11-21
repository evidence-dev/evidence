<script>
	// @ts-check

	/** @type {import("./$types").PageData} */
	export let data;
	let { settings, customFormattingSettings, sources, plugins } = data;
	$: ({ settings, customFormattingSettings, sources, plugins } = data);

	console.log({ settings, sources, plugins });

	import { dev } from '$app/environment';

	import {
		VersionControlPanel,
		DeploySettingsPanel,
		FormattingSettingsPanel,
		TelemetrySettingsPanel,
		SourceConfig
	} from '@evidence-dev/core-components';
</script>

{#if dev}
	<div class="mt-12">
		<VersionControlPanel {settings} />
		<SourceConfig availableSourcePlugins={plugins} {sources} />
		<DeploySettingsPanel {settings} {sources} />
		<FormattingSettingsPanel {customFormattingSettings} />
		<TelemetrySettingsPanel {settings} />
	</div>
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
