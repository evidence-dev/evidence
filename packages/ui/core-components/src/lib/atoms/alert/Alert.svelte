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
		@apply border px-3 py-2 mb-4 rounded border-neutral bg-neutral/20;

		&.info {
			@apply border-info bg-info/20;
		}
		&.danger {
			@apply border-negative bg-negative/20;
		}
		&.success {
			@apply border-positive bg-positive/20;
		}
		&.warning {
			@apply border-warning bg-warning/20;
		}

		& :global(.markdown:last-child) {
			@apply mb-0;
		}
		& :global(.markdown:first-child) {
			@apply mt-0;
		}
	}
</style>
