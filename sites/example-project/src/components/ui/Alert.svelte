<script>
  // Based on the alert from FlowBite: https://flowbite.com/docs/components/alerts/
  import TiInfo from "svelte-icons/ti/TiInfo.svelte";
  import { portal } from "./Portal.svelte";
  /**
   * Defines the color of the alert
   * @type {"default" | "info" | "danger" | "success" | "warning"}
   */
  export let status = "default";

  /**
   * Note that this is pretty specific to the current evidence page layout
   * @type {boolean}
   */
  export let sticky = false;
</script>

<div
  class="alert {status}"
  role="alert"
  class:sticky
  use:portal={{ prepend: true, target: sticky ? "#evidence-content" : null }}
>
  <span class="h-6 block">
    <TiInfo />
  </span>
  <div>
    <slot />
  </div>
</div>

<style lang="postcss">
  .alert {
    @apply p-4 mb-4 text-sm rounded text-gray-800 bg-gray-50 font-medium font-sans border flex items-center gap-2 top-14 w-full;

    &.info {
      @apply text-blue-800 bg-blue-50 border-blue-800;
    }
    &.danger {
      @apply text-red-800 bg-red-50 border-red-800;
    }
    &.success {
      @apply text-green-800 bg-green-50 border-green-800;
    }
    &.warning {
      @apply text-yellow-800 bg-yellow-50 border-yellow-800;
    }
  }
</style>
