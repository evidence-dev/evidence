<script>
	export let options = [];
	export let selected;
</script>

<label for="auth-select">Authentication Method</label>
<select name="auth-methods" id="auth-select" bind:value={selected}>
	{#each options as option}
		<option value={option.value}>{option.description}</option>
	{/each}
</select>

<style>
	label {
		margin-top: 1rem;
		display: block;
		text-transform: uppercase;
		font-weight: normal;
		font-size: 14px;
		font-style: normal;
	}
	select {
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		padding: 0.3rem 0.6rem;
		width: 100%;
		border: 1px solid var(--grey-200);
		font-family: var(--ui-font-family);
		color: var(--grey-800);
		margin: 0.5em 0 0 0;
		transition: all 400ms;
		cursor: pointer;
	}

	select:hover {
		border: 1px solid var(--grey-300);
		transition: all 400ms;
		box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
	}

	select:focus {
		outline: none;
	}
</style>
