<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let open = false;
</script>

<button aria-label="hamburger menu" class:open on:click={() => (open = !open)}>
	<svg width="32" height="24">
		<line id="top" x1="0" y1="2" x2="32" y2="2" />
		<line id="middle" x1="0" y1="12" x2="32" y2="12" />
		<line id="bottom" x1="0" y1="22" x2="32" y2="22" />
	</svg>
</button>

<style>
	svg {
		min-height: 24px;
	}

	svg line {
		stroke: var(--grey-600);
		stroke-width: 3;
	}

	button {
		align-items: center;
		z-index: 10;
		margin-top: 1em;
		margin-bottom: 1em;
		margin-left: 1em;
		margin-right: 0;
		border: none;
		padding: 0px;
		text-align: center;
		text-decoration: none;
		font-size: 16px;
		background-color: hsla(217, 33%, 97%, 0);
		display: flex;
	}

	svg {
		transform: scale(0.85);
	}

	@media (min-width: 850px) {
		button {
			display: none;
		}
	}

	@media print {
		button {
			display: none;
		}
	}
</style>
