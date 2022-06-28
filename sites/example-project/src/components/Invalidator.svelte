<script>
    import { page } from "$app/stores";
    import { invalidate } from '$app/navigation';
    import { blur } from 'svelte/transition'

    import md5 from 'blueimp-md5'



    let loadingPromise 

    let routeHash = md5($page.path)

    const handleClick = async function() {
        loadingPromise = invalidate(`/api/${routeHash}.json`)
    }


        // Poll status .json here 
    async function getStatus() {
        const res = await fetch(`/api/${routeHash}/status.json`);
        const {status} = await res.json();

        if (res.ok) {
                return status;
            } else {
                throw new Error(status);
            }
    }

    async function checkStatusAndInvalidate(statuses) {
        await statuses
        statuses.forEach(query => {
            if(query.status === "not run") {
                return invalidate(`/api/${routeHash}.json`)
            }            
        });
        return true 
    }


        
    let statuses = getStatus();
    let tick = 0

    setInterval(async () => {
        statuses = await getStatus();
        loadingPromise = await checkStatusAndInvalidate(statuses)
        tick += 1
    }, 100)




</script>

{routeHash}

{#await statuses}
    
{:then status} 

{JSON.stringify(status)}
    
{/await}

{#await loadingPromise}
<div class='loading' on:click={handleClick} in:blur|local>
    <h1 class='loading'> Loading... <h1/> 
</div>

{:then result} 
<div class='loaded' on:click={handleClick} in:blur|local>
    <h1 class='loaded'> Loaded <h1/> 
</div>
{/await}

{tick}

<style>
    div {
        border-radius: 8px;
        cursor:pointer;
        padding: 1em
    }

    h1.loaded {
        color: var(--green-900)
    }

    div.loaded {
        background-color: var(--green-100);
        border: 2px solid var(--green-800);
    }

    div.loading {
        background-color: var(--yellow-200);
        border: 2px solid var(--yellow-600);
    }

    h1.loading {
        color: var(--yellow-900)
    }
</style>