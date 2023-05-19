<script>
	export let data;
	let { settings, customFormattingSettings, gitIgnore } = data;
	$: ({ settings, customFormattingSettings, gitIgnore } = data);

	import { dev } from '$app/environment';
</script>

{#if dev}
	<!-- eslint-disable no-undef -->
	<DatabaseSettingsPanel {settings} {gitIgnore} />
	<VersionControlPanel {settings} />
	<DeploySettingsPanel {settings} />
	<FormattingSettingsPanel {settings} {customFormattingSettings} />
	<TelemetrySettingsPanel {settings} />
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
