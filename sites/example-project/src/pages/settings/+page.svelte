<script>
	export let data;
	let { settings, customFormattingSettings } = data;
	$: ({ settings, customFormattingSettings } = data);

	import { dev } from '$app/environment';
</script>

{#if dev}
	<!-- eslint-disable no-undef -->
	<VersionControlPanel {settings} />
	<DeploySettingsPanel {settings} />
	<FormattingSettingsPanel {settings} {customFormattingSettings} />
	<TelemetrySettingsPanel {settings} />
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
