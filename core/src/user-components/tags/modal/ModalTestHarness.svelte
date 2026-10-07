<script lang="ts">
	import { setPageSettingsContext } from '../../../page-settings.context';
	import type { PageSettings } from '../../interfaces/project-settings';
	import DeltaDisplay from '../delta/DeltaDisplay.svelte';
	import Modal from './Modal.svelte';

	let { settings }: { settings: PageSettings } = $props();
	setPageSettingsContext(() => settings);
</script>

<Modal title="Costs" variant="default" icon_only={false}>
	<DeltaDisplay value={0.1} />
</Modal>
