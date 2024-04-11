<script>
	import '@evidence-dev/tailwind/fonts.css';
	import '../app.css';
	import { EvidenceDefaultLayout } from '@evidence-dev/core-components';
	export let data;
</script>

<EvidenceDefaultLayout {data} 
	githubRepo=https://github.com/evidence-dev/evidence
	slackCommunity="https://slack.evidence.dev"
	xProfile="https://twitter.com/evidence_dev"
	builtWithEvidence
	maxWidth="1500" 
	algolia
	>
	<slot slot="content" />
</EvidenceDefaultLayout>
