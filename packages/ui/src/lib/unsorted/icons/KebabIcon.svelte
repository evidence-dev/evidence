<script context="module">
    export const evidenceInclude = true;
</script>
<script>
	export let color;
	export let height = 24;
	export let width = 24;
	export let verticalOffset = 0;
</script>

<span class="icon-container" style="padding-bottom: {verticalOffset}px">
	<span class="icon" style="color: var({color}); height: {height}px; width:{width}px">
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<g transform="rotate(90 12 12)">
				<path
					fill="currentColor"
					d="M20 14a2 2 0 1 1-.001-3.999A2 2 0 0 1 20 14ZM6 12a2 2 0 1 1-3.999.001A2 2 0 0 1 6 12Zm8 0a2 2 0 1 1-3.999.001A2 2 0 0 1 14 12Z"
				/>
			</g>
		</svg>
	</span>
</span>

<style>
	.icon {
		width: 24px;
		height: 24px;
		align-items: center;
	}

	.icon-container {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
	}

	svg {
		margin: auto;
		display: block;
	}
</style>
