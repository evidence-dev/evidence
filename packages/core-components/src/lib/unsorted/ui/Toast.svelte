<script>
	import { scale, fly } from 'svelte/transition';

	export let style = '';
	export let title;
	export let message;
</script>

<div
	class="toast {style}"
	in:scale
	out:fly|local={{ x: 1000, duration: 1000, delay: 0, opacity: 0.8 }}
>
	<span class="title">{title}</span>
	<span class="message">{message}</span>
</div>

<style>
	.toast {
		border-radius: 4px;
		padding: 0.3em 0.75em;
		margin: 1em 0;
		/* box-shadow: 0 10px 20px rgba(0,0,0,.15);
        box-shadow: 0 3px 6px rgba(0,0,0,.10); */
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
		font-size: 0.7em;
		font-family: var(--monospace-font-family);
		display: flex;
		justify-content: space-between;
		/* font-weight: 600; */
	}

	span {
		cursor: pointer;
	}

	span.title {
		font-weight: bold;
	}

	@media print {
		.toast {
			display: none;
		}
	}
</style>
