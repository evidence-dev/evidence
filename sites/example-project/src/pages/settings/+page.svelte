<script>
	/** @type {import("./$types").PageLoadData} */
	export let data;
	let { settings, customFormattingSettings, datasourceSettings } = data;
	$: ({ settings, customFormattingSettings, datasourceSettings } = data);

	import { dev } from '$app/environment';

	import {
		VersionControlPanel,
		DeploySettingsPanel,
		FormattingSettingsPanel,
		TelemetrySettingsPanel
	} from '@evidence-dev/core-components';
</script>

{#if dev}
	<!-- eslint-disable no-undef -->
	<VersionControlPanel {settings} />
	<DeploySettingsPanel {settings} {datasourceSettings} />
	<FormattingSettingsPanel {settings} {customFormattingSettings} />
	<TelemetrySettingsPanel {settings} />
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
