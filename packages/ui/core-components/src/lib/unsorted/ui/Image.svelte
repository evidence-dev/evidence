<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { processDimension, toBoolean } from '../../utils.js';
	import { cn } from '$lib/utils.js';

	let className = undefined;
	export { className as class };

	export let url = ''; // URL of the image
	export let description = ''; // Description for accessibility
	export let width = ''; // Width of the image
	export let height = ''; // Height of the image
	export let align = 'center'; // center, left, right
	export let border = false;
	border = toBoolean(border);

	const alignMap = {
		center: 'center',
		left: 'start',
		right: 'end'
	};
	$: align = alignMap[align] || alignMap['center'];

	// Processed dimensions
	$: processedWidth = processDimension(width);
	$: processedHeight = processDimension(height);
</script>

<div class="flex flex-col items-{align} text-center">
	<img
		src={url}
		alt={description}
		style={`width: ${processedWidth}; height: ${processedHeight};`}
		class={cn(
			`max-w-full h-auto rounded ${border ? 'border border-gray-300 rounded-md shadow-sm' : ''}`,
			className
		)}
		loading="lazy"
	/>
</div>
