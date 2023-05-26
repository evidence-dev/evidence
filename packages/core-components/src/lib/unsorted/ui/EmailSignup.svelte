<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// This is a little gross but I have no idea where this is coming from
	/*global formcarry */

	import { blur } from 'svelte/transition';
	import { onMount } from 'svelte';
	let email = null;
	let submitted = false;

	const submit = function () {
		submitted = true;
	};

	onMount(() => {
		formcarry({
			form: 'zbtQ8WaxJk',
			element: '#email-submit'
		});
	});
</script>

<div>
	{#if !submitted}
		<form on:submit|preventDefault={submit} id="email-submit" accept-charset="UTF-8">
			<input
				type="email"
				name="email"
				required="true"
				placeholder="Email"
				bind:value={email}
				minlength="1"
				class="email"
			/><input type="submit" class="button" value="Get Updates" />
		</form>
	{:else}
		<p transition:blur|local>Thanks for subscribing. We'll be in touch.</p>
	{/if}
</div>

<style>
	div {
		height: 1.8em;
	}

	p {
		font-family: var(--ui-font-family);
		color: #7d7d7d;
		font-size: 0.75em;
	}

	input.button {
		background-color: transparent;
		font-family: var(--ui-font-family);
		color: #7d7d7d;
		font-weight: bold;
		margin-left: 0px;
		border: 1px solid lightgrey;
		border-radius: 0 4px 4px 0;
		height: 100%;
		-webkit-appearance: none;
		-moz-appearance: none;
	}

	form {
		display: inline-block;
		padding: 0 0 0 0;
		height: 1.5em;
	}

	input {
		box-sizing: border-box;
		border-radius: 4px 0 0 4px;
		border: 1px solid lightgrey;
		border-right: none;
		padding: 0.25em 0.25em 0.25em 0.25em;
		margin-right: 0;
		height: 100%;
		color: #7d7d7d;
		-webkit-appearance: none;
		-moz-appearance: none;
	}

	input:required {
		box-shadow: none;
	}

	input:focus {
		outline: none;
	}

	input {
		vertical-align: middle;
	}

	@media (max-width: 600px) {
		div {
			text-align: center;
		}

		input {
			padding: 0.75em 0.5em 0.75em 0.5em;
			font-size: 16px;
		}

		input.email {
			width: 50%;
		}

		input.button {
			font-weight: normal;
			line-height: 0;
		}
	}
</style>
