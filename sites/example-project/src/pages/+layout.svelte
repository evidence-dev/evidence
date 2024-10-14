<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;

	import themes from 'virtual:evidence-themes';
	console.log({ themes });
</script>

<EvidenceDefaultLayout {data}>
	<slot slot="content" />
</EvidenceDefaultLayout>
