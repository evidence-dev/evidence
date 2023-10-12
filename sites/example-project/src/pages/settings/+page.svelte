<script>
	export let data;
	let { settings, customFormattingSettings, gitIgnore } = data;
	$: ({ settings, customFormattingSettings, gitIgnore } = data);

	import { dev } from '$app/environment';

	import {
		DatabaseSettingsPanel,
		VersionControlPanel,
		DeploySettingsPanel,
		FormattingSettingsPanel,
		TelemetrySettingsPanel
	} from '@evidence-dev/core-components';
</script>

{#if dev}
	<!-- eslint-disable no-undef -->
	<div class="mt-12">
		<DatabaseSettingsPanel {settings} {gitIgnore} />
		<VersionControlPanel {settings} />
		<DeploySettingsPanel {settings} />
		<FormattingSettingsPanel {settings} {customFormattingSettings} />
		<TelemetrySettingsPanel {settings} />
	</div>
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
