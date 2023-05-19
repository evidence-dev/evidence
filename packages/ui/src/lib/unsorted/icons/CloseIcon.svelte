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
			class="w-6 h-6"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"
				><title>Close</title><path
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="32"
					d="M368 368L144 144M368 144L144 368"
				/></svg
			>
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
