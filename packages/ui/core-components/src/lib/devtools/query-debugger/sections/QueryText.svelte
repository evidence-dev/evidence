<script>
	import { ContentBox } from '../../../atoms/content-box/index.js';
	import { Hint } from '../../../atoms/hint/index.js';
	import LineNumbered from '../utils/LineNumbered.svelte';
	/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
	export let query;
</script>

<ContentBox>
	<span slot="header">Query Text</span>
	<div class="w-full">
		<Hint>
			<span class="font-bold" slot="handle">Original</span>
			<span>
				<span class="font-mono text-xs">[my-query].originalText</span>
			</span>
		</Hint>
		<p class="italic text-sm">This is the query that was input by the user</p>
		<LineNumbered text={query.originalText} lang="sql" />

		<Hint>
			<span class="font-bold" slot="handle">Executed</span>
			<span>
				<span class="font-mono text-xs">[my-query].text</span>
			</span>
		</Hint>
		<p class="italic text-sm">
			This is the query that was executed after Query did transformations
		</p>
		<LineNumbered text={query.text} lang="sql" />
	</div>
</ContentBox>
