<script>
	export let text;
</script>

<div class="w-full">
	{#each text.split('\n') as line, i}
		<div
			class="grid grid-cols-[auto,1fr] text-[0.7rem] font-mono bg-gray-200 odd:bg-gray-300 w-full"
		>
			<span class="text-white bg-black/70 pr-1.5 pl-1">{i + 1}</span>
			<pre class="pl-2 whitespace-pre-wrap hover:bg-black/30 pr-4">{line}</pre>
		</div>
	{/each}
</div>
