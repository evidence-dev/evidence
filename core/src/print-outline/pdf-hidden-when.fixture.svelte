<script lang="ts">
	import { setQueryService } from '../QueryService.context';
	import type { QueryService } from '../user-components/interfaces/query-service';
	import RepeatChild from '../user-components/tags/repeat/RepeatChild.svelte';
	import PdfHiddenWhen from '../user-components/Renderer/PdfHiddenWhen.svelte';

	let { queryService, notesHiddenIn }: { queryService: QueryService; notesHiddenIn: string[] } =
		$props();

	setQueryService(queryService);
</script>

{#each ['East', 'West'] as value (value)}
	<RepeatChild id="region" {value} column="region">
		<p data-region={value}>{value}</p>
		<PdfHiddenWhen chains={notesHiddenIn}>
			<p data-notes={value}>notes</p>
		</PdfHiddenWhen>
	</RepeatChild>
{/each}
