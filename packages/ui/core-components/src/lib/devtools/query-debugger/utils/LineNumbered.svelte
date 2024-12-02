<script>
	import { onMount } from 'svelte';
	import { loadPrismComponents } from '../../../unsorted/ui/prismLoader.js';

	export let lang;
	export let text;

	let highlight = () => '';

	/** @type {import('../../../unsorted/ui/prismLoader.js').Prism} */
	let Prism;
	onMount(async () => {
		Prism = await loadPrismComponents();
		highlight = Prism.highlight.bind(Prism);
	});

	let highlighted = lang ? highlight(text, Prism?.languages[lang], lang) : text;
	$: highlighted = lang ? highlight(text, Prism?.languages[lang], lang) : text;
</script>

<div class="w-full">
	<div class="grid grid-cols-[auto,1fr] text-[0.7rem] font-mono w-full">
		{#each highlighted.split('\n') as line, i}
			<div class="group contents">
				<span
					class="
			bg-gray-400
			group-odd:bg-gray-500
			group-hover:bg-gray-600
			text-white pr-1.5 pl-1
			select-none">{i + 1}</span
				>
				<pre
					class="
				group-hover:bg-gray-300
				bg-gray-100 group-odd:bg-gray-200
				pl-2 whitespace-pre-wrap pr-4">{@html line}</pre>
			</div>
		{/each}
	</div>
</div>
