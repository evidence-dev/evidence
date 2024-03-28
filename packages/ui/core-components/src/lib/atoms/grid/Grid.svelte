<script context="module">
	export const evidenceInclude = true;
</script>

<script>
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
</script>

<div class="grid {colClasses[cols]} {gapClasses[gapSize]}">
	<slot />
</div>
