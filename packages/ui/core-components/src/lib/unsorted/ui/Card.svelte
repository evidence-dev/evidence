<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let className = '';
</script>

<div
	class={`border border-base-400 rounded-md px-3 py-1 shadow-base-200 ${className}`}
	style="display: inline-block; width: 100%;"
>
	<slot />
</div>
