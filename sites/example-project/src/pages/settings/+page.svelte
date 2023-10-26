<script>
	/** @type {import("./$types").PageLoadData} */
	export let data;
	let { settings, customFormattingSettings, datasourceSettings, plugins } = data;
	$: ({ settings, customFormattingSettings, datasourceSettings, plugins } = data);

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
	<VersionControlPanel {settings} />
	<SourceConfig availableSourcePlugins={plugins} sources={datasourceSettings} />
	<DeploySettingsPanel {settings} {datasourceSettings} />
	<FormattingSettingsPanel {settings} {customFormattingSettings} />
	<TelemetrySettingsPanel {settings} />
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
