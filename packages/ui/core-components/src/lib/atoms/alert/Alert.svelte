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
		@apply border px-3 py-2 mb-4 rounded border-base-content/50 bg-base-content/10;

		&.info {
			@apply border-info/50 bg-info/10;
		}
		&.danger {
			@apply border-negative/50 bg-negative/10;
		}
		&.success {
			@apply border-positive/50 bg-positive/10;
		}
		&.warning {
			@apply border-warning/50 bg-warning/10;
		}

		& :global(.markdown:last-child) {
			@apply mb-0;
		}
		& :global(.markdown:first-child) {
			@apply mt-0;
		}
	}
</style>
