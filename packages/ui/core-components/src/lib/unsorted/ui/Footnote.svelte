<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let id = ''; // Footnote identifier (number or letter)
</script>

<div class="block">
	<div class="inline-flex items-baseline text-xs mb-2 mt-0">
		<!-- Footnote number -->
		<sup class="text-gray-500">{id}</sup>
		<!-- Footnote text -->
		<div class="text-xs ml-1 text-gray-500 leading-tight">
			<slot />
		</div>
	</div>
</div>
