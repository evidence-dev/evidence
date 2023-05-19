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
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-full h-full"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
			/>
		</svg>
	</span>
</span>

<style>
	.icon {
		align-items: center;
		vertical-align: middle;
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
