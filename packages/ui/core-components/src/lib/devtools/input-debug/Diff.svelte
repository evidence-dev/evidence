<script>
	import { formatDiff } from './formatDiff.js';
	import formatDistanceToNowStrict from 'date-fns/formatDistanceToNowStrict';
	import formatDate from 'date-fns/format';
	import { readable } from 'svelte/store';

	/** @type {import("@evidence-dev/sdk").Diff} */
	export let diffData = {
		added: {},
		deleted: {},
		updated: {},
		before: {},
		after: {},
		asof: new Date()
	};

	const typeClasses = {
		added: 'bg-positive/25',
		deleted: 'bg-negative/25',
		updated: 'bg-warning/25',
		unchanged: ''
	};

	$: formattedDiff = formatDiff(diffData);

	const getSymbol = (type) => {
		switch (type) {
			case 'added':
				return '+';
			case 'deleted':
				return '-';
			case 'updated':
				return '~';
			case 'unchanged':
				return ' ';
			default:
				return '?';
		}
	};

	const formattedDate = readable(null, (set) => {
		set(formatDistanceToNowStrict(diffData.asof, { addSuffix: true, includeSeconds: true }));

		const interval = setInterval(() => {
			set(formatDistanceToNowStrict(diffData.asof, { addSuffix: true, includeSeconds: true }));
		}, 5000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<section>
	<span>
		About {$formattedDate} ({formatDate(diffData.asof, 'HH:mm:ss')})
	</span>

	<div
		class="font-mono text-xs grid grid-cols-[auto,1fr] text-[0.7rem] bg-base-200 p-2 select-text"
	>
		{#each formattedDiff as line}
			<div class="group contents">
				<span class="{typeClasses[line.type]} px-1 select-none">
					{getSymbol(line.type)}
				</span>
				<div class="{typeClasses[line.type]} selection:bg-black/15">
					<pre class="whitespace-pre-wrap">{line.content}</pre>
				</div>
			</div>
		{/each}
	</div>
</section>
