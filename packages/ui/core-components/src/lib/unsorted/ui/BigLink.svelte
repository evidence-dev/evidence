<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let href;
</script>

<a {href} >
	<div class="border rounded-md px-2 py-2 text-sm mt-4 mb-5 transition-all duration-200 hover:text-blue-700 hover:shadow-sm">
		<span>
			<slot />
		</span>
	</div>
</a>