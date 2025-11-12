<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	let radius = 25;

	export let overlaps = [
		'A', // A Only
		'AB', // A and B
		'BC', // B and C
		'AC', // A and C
		'ABC' // A, B and C
	];
	export let labels = ['ACRONYM CO', 'GRID REIT', 'First Malaysian'];
	export let amounts = [1232430, 254856548, 36524982];

	// Equilateral triangle of centers
	let side = radius;
	let height = (Math.sqrt(3) / 2) * side;
	let origin = { x: 50 - side / 2, y: 50 + height / 2 };
	let apothem = height / 3;

	// Distance to labels, apothem of outer triangle
	let distanceToLabels = (height + radius + Math.sin((30 * Math.PI) / 180) * radius) / 3;

	// Circles
	let circles = [
		{ x: 50 + '%', y: 50 - height / 2 + '%', class: 'a' },
		{ x: 50 - side / 2 + '%', y: 50 + height / 2 + '%', class: 'b' },
		{ x: 50 + side / 2 + '%', y: 50 + height / 2 + '%', class: 'c' }
	];

	let intercets;

	$: (distanceToLabels,
		(intercets = [
			// A only
			{
				x: 50,
				y: origin.y - 2 * apothem - distanceToLabels,
				value: overlaps[0]?.toLocaleString('en-GB', { style: 'percent' }) ?? ''
			},
			// ABC
			{
				x: 50,
				y: origin.y - apothem,
				value: overlaps[4]?.toLocaleString('en-GB', { style: 'percent' }) ?? ''
			},
			{
				x: 50 - distanceToLabels * Math.cos((30 * Math.PI) / 180),
				y: origin.y - apothem - distanceToLabels * Math.sin((30 * Math.PI) / 180),
				value: overlaps[3]?.toLocaleString('en-GB', { style: 'percent' }) ?? ''
			},
			{
				x: 50 + distanceToLabels * Math.cos((30 * Math.PI) / 180),
				y: origin.y - apothem - distanceToLabels * Math.sin((30 * Math.PI) / 180),
				value: overlaps[1]?.toLocaleString('en-GB', { style: 'percent' }) ?? ''
			},
			{
				x: 50,
				y: origin.y - apothem + distanceToLabels,
				value: overlaps[2]?.toLocaleString('en-GB', { style: 'percent' }) ?? ''
			}
		]));
</script>

<div class="venndiagram-container">
	<svg class="main">
		<!-- Circles -->
		{#each circles as circle}
			<circle class={circle.class} cx={circle.x} cy={circle.y} r={radius + '%'} />
		{/each}
		<!-- Intersect Labels -->
		{#each intercets as intersect}
			<text
				x={intersect.x + '%'}
				y={intersect.y + '%'}
				dominant-baseline="middle"
				text-anchor="middle"
			>
				{intersect.value}
			</text>
		{/each}

		<!-- Circle labels -->
		<text x="0%" y="1%" dominant-baseline="hanging" class="label-a">{labels[0] ?? ''}</text>
		<text x="0%" y="6%" dominant-baseline="hanging" class="label-a"
			>{amounts[0]?.toLocaleString('en-gb') ?? ''}</text
		>

		<text x="0%" y="94%" class="label-b">{labels[2] ?? ''}</text>
		<text x="0%" y="99%" class="label-b">{amounts[2]?.toLocaleString('en-gb') ?? ''}</text>

		<text x="100%" y="94%" text-anchor="end" class="label-c">{labels[1] ?? ''}</text>
		<text x="100%" y="99%" text-anchor="end" class="label-c"
			>{amounts[1]?.toLocaleString('en-gb') ?? ''}</text
		>
	</svg>
</div>

<style>
	svg.main {
		height: 16em;
		width: 16em;
	}

	text {
		font: 0.7em var(--monospace-font-family);
		stroke: none;
	}

	circle {
		pointer-events: all;
		fill-opacity: 0.1;
	}

	.a {
		stroke: var(--info);
		fill: var(--info);
	}

	.b {
		stroke: var(--positive);
		fill: var(--positive);
	}

	.c {
		/* stroke:#fb923c; */
		fill: #8b5cf6;
		stroke: #8b5cf6;
		/* fill: #fb923c; */
		/* fill: #06b6d4; 
    stroke: #06b6d4;  */
		/* stroke: var(--pu-500);
    /* fill: var(--pu-500); */
	}

	.label-a {
		fill: var(--info);
	}

	.label-b {
		fill: var(--positive);
	}

	.label-c {
		fill: #8b5cf6;
		/* fill: #fb923c; */
	}

	div.venndiagram-container {
		display: flex;
		margin: 1.5em 0;
		align-items: center;
		justify-items: flex-end;
	}
</style>
