<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
	import { base } from '$app/paths';
</script>

<svelte:head>
	<link rel="icon" href="{base}/favicon.ico" sizes="32x32" />
	<link rel="icon" href="{base}/icon.svg" type="image/svg+xml" />
	<link rel="icon" href="{base}/apple-touch-icon.png" />
	<link rel="manifest" href="{base}/manifest.webmanifest" />
</svelte:head>

<EvidenceDefaultLayout {data}>
	<slot slot="content" />
</EvidenceDefaultLayout>
