<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<EvidenceDefaultLayout {data} title="Evidence Test Environment">
	<svelte:fragment slot="content">
		<slot/>
	</svelte:fragment>
</EvidenceDefaultLayout>
