<head>
    <script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
</head>

<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import './getting-started.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<EvidenceDefaultLayout {data} 
	githubRepo=https://github.com/evidence-dev/evidence
	slackCommunity="https://slack.evidence.dev"
	xProfile="https://twitter.com/evidence_dev"
	builtWithEvidence
	maxWidth="1500" 
	algolia={{
		apiKey: "45d995e97069b6fbee526a93a6c84af8",
		appId: "KHH9ANIISC",
		indexName: "docs-evidence"
	}}
	>
	<slot slot="content" />
</EvidenceDefaultLayout>
