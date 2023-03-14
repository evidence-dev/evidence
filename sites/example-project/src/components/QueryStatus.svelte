<script>
  import { invalidate } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import QueryToast from "./ui/QueryToast.svelte";
  import { delay } from '$lib/delay'
  import { routeHash } from "./ui/stores";
  export let endpoint = '';

  let statuses = [];
  let previousStatus = [];
  $: activeStatuses = statuses.filter(
    (d) => d.status != "not run" && d.status != "from cache"
  );

  async function getStatus() {
    if (endpoint == "") {
        return [];
    }

    let statusEndpoint = `/api/status${$page.route.id}`.replace(/\/$/, "")
    const res = await fetch(statusEndpoint);
    const { status } = await res.json();

    if (res.ok) {
      return status;
    } else {
      throw new Error(status);
    }
  }

  async function checkStatusAndInvalidate() {
    statuses = await getStatus();
    // Check if queries have been removed from the page entirely
    if (statuses.length != previousStatus.length) {
      await invalidate((url) => url.pathname === `/api/${endpoint}.json`)
      await delay(500)
      
    }
    if (statuses.length > 0) {
      for(let i = 0; i < statuses.length; i++){

        if(statuses[i].status === "error"){
          console.error(statuses[i].status)
        }
        const query = statuses[i]
        if (query.status === "not run") {
          // force svelte load on API endpoint & front-end page
          await invalidate((url) => url.pathname === `/api/${endpoint}.json`)
          await invalidate((url) => url.pathname === window.location.pathname)
          await delay(500)
        }
      }
      await delay(500)
      activeStatuses.push(...statuses)
    }

    previousStatus = statuses

  }

  onMount(() => {
    endpoint = $routeHash
    const interval = setInterval(() => {
      checkStatusAndInvalidate();
    }, 100);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="container">
  {#each activeStatuses as status}
      <QueryToast bind:status={status} />
  {/each}
</div>

<style>
  div.container {
    z-index: 1;
    position: fixed;
    right: 0;
    bottom: 0;
    margin: 1.5em 2.5em;
    width: 20em;
  }
</style>
