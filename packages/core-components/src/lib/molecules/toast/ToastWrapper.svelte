<script>
	import Toast from './Toast.svelte';
	import { toasts } from '@evidence-dev/component-utilities/stores';
</script>

<div class="z-[1] fixed right-0 bottom-0 mx-10 my-6 w-80">
	{#each $toasts as toast (toast.id)}
		<Toast {...toast} on:dismiss={({ detail }) => toasts.dismiss(detail.id)} />
	{/each}
</div>
