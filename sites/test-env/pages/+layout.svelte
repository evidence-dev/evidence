<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout, QueryDebugger } from '@evidence-dev/core-components';
	export let data;
</script>

<QueryDebugger>
	<EvidenceDefaultLayout {data} title="Evidence Test Environment">
		<svelte:fragment slot="content">
			<slot/>
		</svelte:fragment>
	</EvidenceDefaultLayout>
</QueryDebugger>
