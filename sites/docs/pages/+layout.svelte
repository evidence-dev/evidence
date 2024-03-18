<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<EvidenceDefaultLayout {data} 
	builtWithEvidence 
	slackCommunity="https://slack.evidence.dev" 
	xProfile="https://twitter.com/evidence_dev"
	githubRepo="https://github.com/evidence-dev/evidence"
	algolia={{appId: 'KHH9ANIISC', apiKey: 'd2bd44615d8d5f5464e54f06e82edd19', indexName: 'docs-evidence'}}
>
	<slot slot="content" />
</EvidenceDefaultLayout>
