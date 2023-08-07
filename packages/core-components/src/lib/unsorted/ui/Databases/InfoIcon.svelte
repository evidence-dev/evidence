<script>
	import { fade } from 'svelte/transition';

	let visible = false;

	const showMessage = () => (visible = true);
	const hideMessage = () => (visible = false);
</script>

<span
	on:focus={showMessage}
	on:blur={hideMessage}
	on:mouseenter={showMessage}
	on:mouseleave={hideMessage}
	class="additional-info-icon"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
		class="w-5 h-5"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
		/>
	</svg>

	{#if visible}
		<span transition:fade class="info-msg">
			<slot />
		</span>
	{/if}
</span>

<style scoped>
	span.additional-info-icon {
		width: 18px;
		color: var(--grey-600);
		display: inline-block;
		vertical-align: middle;
		line-height: 1em;
		cursor: help;
		position: relative;
		text-transform: none;
	}

	.info-msg {
		@apply text-sm text-white bg-gray-900/90 rounded py-1 px-2 absolute -top-[5%] left-[105%] z-50 min-w-[200px] max-w-sm;
	}
</style>
