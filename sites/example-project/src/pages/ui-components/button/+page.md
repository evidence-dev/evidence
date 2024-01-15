<script>
    import {Pencil} from '@evidence-dev/component-utilities/icons'

    const icons = [
        { iconPosition: "left", icon: Pencil },
        { iconPosition: "right", icon: Pencil },
        { iconPosition: "hidden", icon: undefined }
    ]
    const variants = ["success", "info", "warn", "error"]
    const sizes = ["sm", "base", "lg"]

</script>



<table class="w-full border border-black">
    <tr>
        <th class="pl-4 py-4">Variant</th>
        <th class="bg-gray-200">Outlined</th>
        <th>Size</th>
        <th class="bg-gray-200">Icon Position</th>
        <th></th>
    </tr>

    {#each variants as variant}
    {#each [false, true] as outline}
    {#each sizes as size}
    {#each icons as {iconPosition, icon}}
    <tr class="odd:bg-gray-200 border border-gray-700 group text-center">
        <td class="pl-4 h-16">{variant}</td>
        <td class="group-odd:bg-gray-400 group-even:bg-gray-200">{outline}</td>
        <td>{size}</td>
        <td class="group-odd:bg-gray-400 group-even:bg-gray-200">{iconPosition}</td>
        <td class="pr-4"><div class="flex justify-center items-middle h-full"><Button {size} {variant} {iconPosition} {icon} {outline}>Click Me!</Button></div></td>
    </tr>
    {/each}
    {/each}
    {/each}
    {/each}
</table>