<script>
	export let height = 24;
	export let width = 24;
	export let verticalOffset = 0;
</script>

<span class="icon-container" style="padding-bottom: {verticalOffset}px">
	<span class="icon" style="height: {height}px; width:{width}px">
		<svg fill="currentColor" viewBox="0 0 32 32" id="icon" xmlns="http://www.w3.org/2000/svg">
			<mask id="mask">
				<rect width="32" height="32" fill="white" />
				<polygon points="-0.5,29 21.5,7 28.5,8.5 6.5,30.5" fill="black" />
			</mask>
			<polygon mask="url(#mask)" points="24 21 24 9 22 9 22 23 30 23 30 21 24 21" />
			<path
				mask="url(#mask)"
				d="M18,9H14a2,2,0,0,0-2,2V21a2,2,0,0,0,2,2h1v2a2,2,0,0,0,2,2h2V25H17V23h1a2,2,0,0,0,2-2V11A2,2,0,0,0,18,9ZM14,21V11h4V21Z"
			/>
			<path
				mask="url(#mask)"
				d="M8,23H2V21H8V17H4a2,2,0,0,1-2-2V11A2,2,0,0,1,4,9h6v2H4v4H8a2,2,0,0,1,2,2v4A2,2,0,0,1,8,23Z"
			/>
			<polygon points="4,27 26,5 27.5,6.5 5.5,28.5" />
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
