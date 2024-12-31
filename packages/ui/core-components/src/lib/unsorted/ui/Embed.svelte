<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { cn } from '$lib/utils.js';
	import { toBoolean } from '../../utils.js';

	let className = undefined;
	export { className as class };

	export let url = ''; // The URL to embed
	export let title = ''; // A description or title for the embed
	export let width = '100%'; // Width of the embed, defaults to full width
	export let height = '400'; // Height of the embed, defaults to 400px
	export let align = 'left'; // center, left, right
	export let border = true; // Toggle border visibility
	border = toBoolean(border);

	// Process dimensions: Add `px` if a number, pass through if a valid unit
	function processDimension(dimension) {
		return /^\d+$/.test(dimension) ? `${dimension}px` : dimension;
	}

	$: tailwindWidth = processDimension(width);
	$: tailwindHeight = processDimension(height);
</script>

<div
	class={cn(
		`embed-wrapper relative overflow-hidden rounded-md ${
			border ? 'border border-gray-300 shadow-sm' : ''
		} ${align === 'center' ? 'mx-auto' : align === 'left' ? 'ml-0' : 'mr-0 ml-auto'}`,
		className
	)}
	style={`width: ${tailwindWidth}; height: ${tailwindHeight};`}
>
	<iframe
		src={url}
		{title}
		class="absolute inset-0 w-full h-full"
		loading="lazy"
		frameborder="0"
		allowfullscreen
	></iframe>
</div>
