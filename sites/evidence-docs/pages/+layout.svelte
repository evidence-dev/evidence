<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<EvidenceDefaultLayout
	{data}
	githubRepo="https://github.com/evidence-dev/evidence"
	slackCommunity="https://slack.evidence.dev/"
	xProfile="https://twitter.com/evidence_dev"
	algolia={{
		appId: 'KHH9ANIISC',
		// Public API key
		apiKey: 'd2bd44615d8d5f5464e54f06e82edd19',
		indexName: 'docs-evidence'
	}}
	neverShowQueries
>
	<slot slot="content" />
</EvidenceDefaultLayout>
