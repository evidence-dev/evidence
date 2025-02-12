<script>
	export let title = undefined;
	$: labelled = $$props['aria-label'] || $$props['aria-labelledby'] || title;
	$: attributes = {
		'aria-hidden': labelled ? undefined : true,
		role: labelled ? 'img' : undefined,
		focusable: Number($$props['tabindex']) === 0 ? true : undefined
	};
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 32 32"
	fill="currentColor"
	width="100%"
	height="100%"
	preserveAspectRatio="xMidYMid meet"
	{...attributes}
	{...$$restProps}
>
	{#if title}<title>{title}</title>{/if}
	<path
		d="M28,10V28H10V10H28m0-2H10a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2Z"
	/><path d="M4,18H2V4A2,2,0,0,1,4,2H18V4H4Z" />
</svg>
