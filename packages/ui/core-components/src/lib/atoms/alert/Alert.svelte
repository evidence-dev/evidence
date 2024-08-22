<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	// Based on the alert from FlowBite: https://flowbite.com/docs/components/alerts/
	/**
	 * Defines the color of the alert
	 * @type {"default" | "info" | "danger" | "success" | "warning"}
	 */
	export let status = 'default';
</script>

<div class="alert {status}" role="alert">
	<div>
		<slot />
	</div>
</div>

<style lang="postcss">
	.alert {
		@apply p-2 mb-4 rounded text-foreground bg-muted top-14;

		&.info {
			@apply text-blue-800 dark:text-blue-100 bg-blue-100 dark:bg-blue-900;
		}
		&.danger {
			@apply text-destructive bg-destructive/10 dark:text-red-100 dark:bg-red-900;
		}
		&.success {
			@apply text-green-800 dark:text-green-100 bg-green-100 dark:bg-green-900;
		}
		&.warning {
			@apply text-yellow-800 dark:text-yellow-100 bg-yellow-100 dark:bg-yellow-900;
		}

		& :global(p) {
			@apply mb-0;
		}
	}
</style>
