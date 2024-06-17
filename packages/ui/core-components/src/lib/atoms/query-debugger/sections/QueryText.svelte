<script>
	import { ContentBox } from '../../content-box/index.js';
	import { Hint } from '../../hint/index.js';
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
		<pre class="overflow-x-auto text-xs bg-gray-300 px-2 py-1 overfloz">{query.originalText}</pre>

		<Hint>
			<span class="font-bold" slot="handle">Executed</span>
			<span>
				<span class="font-mono text-xs">[my-query].text</span>
			</span>
		</Hint>
		<p class="italic text-sm">
			This is the query that was executed after Query did transformations
		</p>
		<pre class="overflow-x-auto text-xs bg-gray-300 px-2 py-1">{query.text}</pre>
	</div>
</ContentBox>
