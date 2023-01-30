<script>
  export let data;
  let { settings, customFormattingSettings, gitIgnore } = data;
  $: ({ settings, customFormattingSettings, gitIgnore } = data);

  import { dev } from "$app/environment";
  import DatabaseSettingsPanel from "@evidence-dev/components/ui/Databases/DatabaseSettingsPanel.svelte";
  import VersionControlPanel from "@evidence-dev/components/ui/VersionControl/VersionControlPanel.svelte";
  import DeploySettingsPanel from "@evidence-dev/components/ui/Deployment/DeploySettingsPanel.svelte";
  import FormattingSettingsPanel from "@evidence-dev/components/ui/Formatting/FormattingSettingsPanel.svelte";
  import TelemetrySettingsPanel from "@evidence-dev/components/ui/TelemetryOptOut/TelemetrySettingsPanel.svelte";
</script>

{#if dev}
  <DatabaseSettingsPanel {settings} {gitIgnore} />
  <VersionControlPanel {settings} />
  <DeploySettingsPanel {settings} />
  <FormattingSettingsPanel {settings} {customFormattingSettings} />
  <TelemetrySettingsPanel {settings} />
  <br />
{:else}
  <p>Settings are only available in development mode.</p>
{/if}
