<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let error = undefined;
</script>

<span
	class="group inline-flex items-center relative cursor-help cursor-helpfont-sans px-1 border border-red-200 py-[1px] bg-red-50 rounded"
>
	<span class="inline font-sans font-medium text-xs text-red-600">error</span>
	<span
		class="hidden text-white font-sans group-hover:inline absolute -top-1 left-[105%] text-sm z-10 px-2 py-1 bg-gray-800/80 leading-relaxed min-w-[150px] max-w-[400px] rounded-md"
		>{error}</span
	>
</span>
