<script>
	import Info from '../tags/info/Info.svelte';

	let {
		title,
		subtitle,
		info = undefined,
		info_link = undefined,
		info_link_title = undefined
	} = $props();
</script>

<!--
	Use span/div (not <p>) so theme-css-helper's `.prose p { color: … !important }`
	rule doesn't force these onto foreground and clobber `text-muted-foreground`.
-->
<div class="mb-2">
	{#if title}
		<span class="text-foreground text-sm font-bold">
			{title}
			{#if info}
				<Info text={info} link={info_link} link_title={info_link_title} className="ml-0.5" />
			{/if}
		</span>
	{/if}
	{#if subtitle}
		<div class="text-muted-foreground text-sm font-normal">{subtitle}</div>
	{/if}
</div>
