<script>
  import ContentsList from './ContentsList.svelte';
  import {navigating} from '$app/stores'
</script>

<div class="container">
  {#if !$navigating}
    <ContentsList/>
  {/if}
</div>

<style>
	div.container {
		position: sticky;
		top: var(--header-height);
		height: 70vh;
		overflow-y: auto;
	}
</style>
