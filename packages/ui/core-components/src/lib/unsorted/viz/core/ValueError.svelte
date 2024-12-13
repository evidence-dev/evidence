<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let error = undefined;
</script>

<span
	class="group inline-flex items-center relative cursor-help cursor-helpfont-sans px-1 border border-negative/50 py-[1px] bg-negative/10 rounded"
>
	<span class="inline font-sans font-medium text-xs text-negative">error</span>
	<span
		class="hidden font-sans group-hover:inline absolute -top-1 left-[105%] text-sm z-10 px-2 py-1 bg-base-100 border border-base-300 leading-relaxed min-w-[150px] max-w-[400px] rounded-md"
		>{error}</span
	>
</span>
