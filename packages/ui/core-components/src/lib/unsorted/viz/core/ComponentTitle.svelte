<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let title;
	export let subtitle;
</script>

<div class="mt-0 mb-0">
	{#if title}
		<h4 class="text-[14px] text-base-heading font-bold mt-0 mb-{subtitle ? '1' : '2'} leading-none">
			{title}
		</h4>
	{/if}
	{#if subtitle}
		<p class="text-[13px] text-base-content-muted font-normal mt-0 mb-2">
			{subtitle}
		</p>
	{/if}
</div>
