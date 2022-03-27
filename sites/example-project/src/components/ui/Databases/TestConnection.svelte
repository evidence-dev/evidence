<script>

    let result = null;
    async function runTest() {

        const sleep = ms => new Promise(r => setTimeout(r, ms));
        await sleep(1000)
		const res = await fetch("/api/testConnection.json", {
			method: "POST",
		})
        result = await res.json()

        if (res.ok) {
			return "✓ " + result;
		} else {
			throw new Error(result);
		}
	};

    let promise = '';

    function handleClick() {
        promise = runTest();
    }
</script>

<div class=test-container>
    <button id=run-test on:click={handleClick}>Test Connection</button>

    <div class=message>
        {#await promise}
            <div class=loader><div class=loading-icon></div><span class=loading>Running connection test</span></div>
        {:then result} 
            <span class=success>{result}</span>
        {:catch error}
            <span class=error>{error.message}</span>
        {/await}
    </div>
</div>

<style>

.test-container {
    display: block;
    margin-top: 10px;
}

.message {
    display: inline;
}

.loader {
    display: inline;
}

.loading-icon {
    display: inline-block;
    margin-right: 0.5em;
    height: 1em;
    width: 1em;
    border-color: grey transparent grey grey;
    border-width: calc(1em / 15);
    border-style: solid;
    border-image: initial;
    border-radius: 50%;
    animation: 0.75s linear 0s infinite normal none running rotate;
}

@keyframes rotate {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }

.loading {
    font-size: 14px;
    font-family: var(--ui-font-family);
}

.success {
    font-size: 14px;
    font-family: var(--ui-font-family);
    color: rgb(2, 179, 2);
}

.error {
    font-size: 14px;
    font-family: var(--ui-font-family);
    color: red;
}

button {
    padding:0.4em 0.5em;
    margin-right: 0.25em;
    margin-left: auto;
    font-style: normal;
    text-decoration: none;
    font-size:14px;
    cursor:pointer;
}
    
button:hover {
    box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
    transition:all 350ms;
}

#run-test {
    background-color: var(--blue-600);
    color:white;
    font-weight: bold;
    border-radius: 4px;
    border: 1px solid var(--blue-700);
    padding:0.4em 1.10em;
    transition-property: background, color;
    transition-duration: 350ms;
}

#run-test:active {
    background-color: var(--blue-800);
    color:white;
    font-weight: bold;
    border-radius: 4px;
    border: 1px solid var(--blue-900);
    padding:0.4em 1.10em;
    transition-property: background, color;
    transition-duration: 350ms;
}
</style>