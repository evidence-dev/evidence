<script>
	async function getStatus() {
		const res = await fetch(`/api/queryStatus.json`);
		const {queryProgress} = await res.json();

		if (res.ok) {
			return queryProgress;
		} else {
			throw new Error(queryProgress);
		}
	}
	
	let promise = getStatus();

	function handleClick() {
		promise = getStatus();
	}
</script>

<button on:click={handleClick}>
	Check status 
</button>

{#await promise}
	<p>...waiting</p>
{:then queryProgress}
    <p>
        {#if queryProgress.status != 'done'}
        <span>🏃🏃🏃Queries Are Running!🏃🏃🏃</span>
        {:else if queryProgress.status === 'done'}
        <span>✅✅✅✅Queries Are Done!✅✅✅✅</span>
        {/if}
    </p>

{:catch error}
	<p style="color: red">{error.message}</p>
{/await}

