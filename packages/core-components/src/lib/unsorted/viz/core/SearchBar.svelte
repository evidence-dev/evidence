<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Search } from '@steeze-ui/tabler-icons';

	export let placeholder = 'Search';
	export let value;
	export let searchFunction;
</script>

<div class="search-container">
	<input
		class="search-bar"
		type="text"
		{placeholder}
		bind:value
		on:keyup={() => searchFunction(value)}
	/>
	<div class="search-icon">
		<Icon src={Search} class="pl-0.5" />
	</div>
</div>

<style>
	.search-container {
		width: 30%;
		display: block;
		align-items: center;
		border: 1px solid var(--grey-300);
		border-radius: 4px;
		height: 22px;
		position: relative;
		margin: 25px 3px 10px 3px;
		box-sizing: content-box;
	}

	.search-icon {
		height: 16px;
		width: 16px;
		padding-left: 3px;
		margin: 0;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		-ms-transform: translateY(-50%);
		color: var(--grey-400);
		box-sizing: content-box;
	}

	.search-bar {
		margin: 0;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		-ms-transform: translateY(-50%);

		border: none;
		padding-left: 23px;

		color: var(--grey-600);
		font-size: 9pt;

		width: calc(100% - 30px);

		font-family: Arial;
		line-height: normal;
	}

	input.search-bar::placeholder {
		color: var(--grey-700);
	}

	*:focus {
		outline: none;
	}

	@media (max-width: 600px) {
		.search-container {
			width: 98%;
			height: 28px;
		}

		.search-bar {
			font-size: 16px;
			width: calc(100% - 40px);
		}
	}

	@media print {
		.search-container {
			visibility: hidden;
		}
	}
</style>
