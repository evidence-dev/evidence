<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let url = ''; // URL of the image
	export let description = ''; // Description for accessibility
	export let width = ''; // Width of the image
	export let height = ''; // Height of the image

	// Function to process width/height
	function processDimension(dimension) {
		if (!dimension) return ''; // No dimension provided
		return /^\d+$/.test(dimension) ? `${dimension}px` : dimension; // Add 'px' if it's a number
	}

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
