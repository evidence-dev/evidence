<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	import EditInGitHub from '../components/EditInGitHub.svelte';
	export let data;
	import { page } from '$app/stores';
	let pageRoute = $page.route.id.replace(/\/$/, '')
</script>

<head>
	<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
</head>

<svelte:head>
	<meta property="twitter:image" content="https://docs.evidence.dev{pageRoute}/og.png"/>	
	<meta property="og:image" content="{pageRoute}/og.png"/>
</svelte:head>
<EvidenceDefaultLayout
	{data}
	githubRepo="https://github.com/evidence-dev/evidence"
	slackCommunity="https://slack.evidence.dev"
	xProfile="https://twitter.com/evidence_dev"
	blueskyProfile="https://bsky.app/profile/evidence.dev"
	builtWithEvidence
	algolia={{
		apiKey: '45d995e97069b6fbee526a93a6c84af8',
		appId: 'KHH9ANIISC',
		indexName: 'docs-evidence'
	}}
>
	<slot slot="content" />
</EvidenceDefaultLayout>

<EditInGitHub />
