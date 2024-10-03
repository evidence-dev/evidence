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
		@apply p-2 mb-4 rounded bg-neutral/30 dark:bg-neutral/50 text-neutral-content top-14;

		&.info {
			@apply bg-info/30 dark:bg-info/70 text-info-content;
		}
		&.danger {
			@apply bg-negative/30 dark:bg-negative/70 text-negative-content;
		}
		&.success {
			@apply bg-positive/30 dark:bg-positive/70 text-positive-content;
		}
		&.warning {
			@apply bg-warning/30 dark:bg-warning/70 text-warning-content;
		}

		& :global(p) {
			@apply mb-0;
		}
	}
</style>
