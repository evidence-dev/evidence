<script>
	// @ts-check

	/** @type {import("./$types").PageData} */
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
	<div class="mt-12">
		<VersionControlPanel {settings} />
		<SourceConfig availableSourcePlugins={plugins} sources={datasourceSettings} />
		<DeploySettingsPanel {settings} {datasourceSettings} />
		<FormattingSettingsPanel {customFormattingSettings} />
		<TelemetrySettingsPanel {settings} />
	</div>
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
