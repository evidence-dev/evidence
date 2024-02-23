<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let hidden = false;
</script>

<div class="break-inside-avoid" class:print:hidden={hidden}>
	<slot />
</div>
