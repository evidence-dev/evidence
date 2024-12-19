<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<EvidenceDefaultLayout lightLogo="/lightLogo.png" darkLogo="/darkLogo.png" {data}>
	<slot slot="content" />
</EvidenceDefaultLayout>
