<script context="module">
	export const evidenceInclude = true;
</script>

<script>
    export let title="Definitions";
</script>

<details class="mb-4 mt-3">
    <summary class="italic text-base text-grey-800 cursor-pointer">
        {title}
    </summary>
    <div class="ml-3 pt-3 mb-6 text-base">
        <slot></slot>
    </div>
</details>