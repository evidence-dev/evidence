<script>
  import { fly, scale } from "svelte/transition";
  import { page } from "$app/stores";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import { routeHash } from './ui/stores'
  export let endpoint = $routeHash;

  let loadingPromise;
  let statuses = [];
  $: activeStatuses = statuses.filter(
    (d) => d.status != "not run" && d.status != "from cache"
  );

  async function getStatus() {
    const res = await fetch(`/api/${endpoint}/status.json`);
    const { status } = await res.json();

    if (res.ok) {
      return status;
    } else {
      throw new Error(status);
    }
  }

  function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function checkStatusAndInvalidate(priorStatuses) {
    statuses = await getStatus();
    // Check if queries have been removed from the page entirely
    if (priorStatuses.length > 0 && statuses.length === 0) {
      loadingPromise = invalidate(`/api/${endpoint}.json`).then(() =>
        timeout(1000)
      );
    }
    if (statuses.length > 0) {
      statuses.forEach((query) => {
        if (query.status === "not run") {
          loadingPromise = invalidate(`/api/${endpoint}.json`).then(() =>
            timeout(1000)
          );
        }
      });
    }
    return true;
  }

  onMount(async () => {
    setInterval(async () => {
      checkStatusAndInvalidate(statuses);
    }, 100);
  });
</script>

<div class="container">
  {#each activeStatuses as status (status.id)}
    {#await loadingPromise}
      <div
        id="toast"
        class:running={status.status === "running" ||
          status.status === "not run"}
        class:error={status.status === "error"}
        class:done={status.status === "done" || status.status === "from cache"}
        in:scale
        out:fly|local={{ x: 1000, duration: 1000, delay: 0, opacity: 0.8 }}
      >
        <span class="queryID">
          {status.id}
        </span>
        <span class="status">
          {status.status}
        </span>
      </div>
    {/await}
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

  #toast {
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

  div.running {
    border: 1px solid var(--grey-400);
    background-color: white;
    color: var(--grey-999);
    transition: all 400ms;
  }

  div.error {
    border: 1px solid var(--red-500);
    background-color: var(--red-100);
    color: var(--red-999);
    transition: all 400ms;
  }

  div.done {
    border: 1px solid var(--green-500);
    background-color: var(--green-100);
    color: var(--green-999);
    transition: all 400ms;
  }

  span {
    cursor: pointer;
  }

  span.queryID {
    font-weight: bold;
  }
</style>
