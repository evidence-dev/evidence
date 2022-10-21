<script>
    import {blur, fade, fly, scale, slide} from "svelte/transition"
    import { flip } from 'svelte/animate';
    import { page } from "$app/stores";
    import { invalidate } from '$app/navigation';
    import {onMount} from 'svelte'
    import md5 from 'blueimp-md5'
    export let endpoint = md5($page.path)

    let loadingPromise
    let statuses = []

    async function getStatus() {
        const res = await fetch(`/api/${endpoint}/status.json`);
        const {status} = await res.json();

        if (res.ok) {
                return status;
            } else {
                throw new Error(status);
            }
    }

    function timeout(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function checkStatusAndInvalidate() {
        statuses = await getStatus()
        statuses.forEach(query => {
            if(query.status === "not run") {
                loadingPromise = invalidate(`/api/${endpoint}.json`).then(resolve => timeout(1000))
            }            
        });
        return true 
    }

    onMount(async () => {
        setInterval(async () => {
            checkStatusAndInvalidate()
        }, 100)
    })
</script>

<div class=container>
    {endpoint}
    {$page.path}
    {JSON.stringify($page)}
    
{#each statuses as status (status.id)}
{#await loadingPromise}
    {#if status.status != "not run" && status.status != "from cache"}
    <div 
        id=toast 
        class:running={status.status === "running"|| status.status === "not run"} 
        class:error={status.status === "error"} 
        class:done={status.status === "done" || status.status === "from cache"} 
        in:scale 
        out:fly="{{ x: 1000, duration: 1000, delay:1100, opacity: 0.8 }}"
    >
        <span class=queryID>
            {status.id} 
        </span>
        <span class=status>
            {status.status}
        </span>
    </div>
    {/if}
    {/await}
{/each}
</div>



<style>
    div.container {
        z-index: 1;
        position: fixed;
        right:0;
        bottom: 0;
        margin:1.5em 2.5em;
        width: 20em;
    }

    #toast {
        border-radius: 4px;
        padding: 0.3em 0.75em ;
        margin: 1em 0;
        /* box-shadow: 0 10px 20px rgba(0,0,0,.15);
        box-shadow: 0 3px 6px rgba(0,0,0,.10); */
        box-shadow: 0 1px 3px rgba(0,0,0,.6);
        box-shadow: 0 1px 2px rgba(0,0,0,.12);
        font-size: 0.70em;
        font-family: var(--monospace-font-family);
        display: flex;
        justify-content:space-between;
        /* font-weight: 600; */
    }

    div.running{
        border: 1px solid var(--grey-400);
        background-color: white;
        color: var(--grey-999);
        transition:all 400ms;
    }

    div.error{
        border: 1px solid var(--red-500);
        background-color: var(--red-100);
        color: var(--red-999);
        transition:all 400ms;

    }

    div.done{
        border: 1px solid var(--green-500);
        background-color: var(--green-100);
        color: var(--green-999);
        transition:all 400ms;

    }

    span {
        cursor: pointer;
    }

    span.queryID {
        font-weight: bold;
    }
</style>
