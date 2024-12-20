<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { processDimension } from '../../utils.js';

	export let url = ''; // URL of the image
	export let description = ''; // Description for accessibility
	export let width = ''; // Width of the image
	export let height = ''; // Height of the image

	// Processed dimensions
	$: processedWidth = processDimension(width);
	$: processedHeight = processDimension(height);
</script>

<div class="flex flex-col items-center text-center">
	<img
		src={url}
		alt={description}
		style={`width: ${processedWidth}; height: ${processedHeight};`}
		class="max-w-full h-auto rounded"
		loading="lazy"
	/>
</div>
