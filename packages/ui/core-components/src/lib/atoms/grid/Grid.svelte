<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { setContext } from 'svelte';

	/** @type {1|2|3|4|5|6}*/
	export let cols = 2;

	/** @type {"none"|"sm"|"md"|"lg"}*/
	export let gapSize = 'md';

	const colClasses = Object.freeze({
		[1]: 'grid-cols-1',
		[2]: 'grid-cols-1 sm:grid-cols-2',
		[3]: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
		[4]: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
		[5]: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
		[6]: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
	});

	const gapClasses = Object.freeze({
		none: 'gap-0',
		sm: 'gap-2',
		md: 'gap-4',
		lg: 'gap-8'
	});

	const gapWidths = Object.freeze({
		none: 0,
		sm: 8,
		md: 16,
		lg: 32
	});

	// Create a simple unique identifier based on a timestamp and a random suffix
	let gridId = `grid-${Date.now()}-${Math.round(Math.random() * 1000)}`;

	let gapWidth = gapWidths[gapSize];

	// Setting grid context - used by charts during print to set appropriate width:
	setContext('gridConfig', { gridId, cols, gapWidth });
</script>

<div class="grid {colClasses[cols]} {gapClasses[gapSize]}">
	<slot />
</div>
