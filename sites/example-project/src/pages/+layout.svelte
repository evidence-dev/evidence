<script>
	import { browser } from '$app/environment';
	if (browser) {
		const splash = document.querySelector('#splash');
		splash?.remove();
	}

	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<EvidenceDefaultLayout {data}>
	<slot slot="content" />
</EvidenceDefaultLayout>
