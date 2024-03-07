<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let enabled = true;
</script>

<div class:print:hidden={enabled} class="contents">
	<slot />
</div>
