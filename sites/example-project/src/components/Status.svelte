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
	let tick = 0

	setInterval(() => {
    	tick += 1
		promise = getStatus()
	}, 100)

</script>

{tick}

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