<script>
    export let name = "";
    export let description = "";
    export let required = false;
    export let options = [];
    export let defaultValue = "";
    export let type = "";
    let copyStatus = {};

    async function copyToClipboard(text, option) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Copied to clipboard: ' + text);
            copyStatus[option] = true;
            setTimeout(() => {
                copyStatus[option] = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }
</script>
  
<section class="py-4 border-t">
        <div class="flex flex-col lg:flex-row">
            <div class="text-base font-mono flex flex-row min-w-48 items-center mr-4 pb-1">
                <div class="text-fuscia-400 text-sm px-1 py-0 mr-4 bg-gray-50 border rounded-md">{name}</div>
                {#if required === true || required === "true"}
                <div class="text-red-500 text-sm font-normal pr-6 pt-0.5">REQUIRED</div>
                {/if}
            </div>
            <div class="font-sans font-normal text-base text-gray-600">
                <div>{@html description}</div>
       
    
    {#if Array.isArray(options) && options.length > 0}
    <div class="flex items-center mt-2 flex-wrap">
        <span class="text-sm text-gray-400">Options:</span>
        {#each options as option, index (option)}
        <div class="group ml-2 relative">
            <button class="text-sm font-mono bg-blue-100 text-blue-600 px-1.5 py-0.5 mt-0.5 md:px-2 md:py-1 md:mt-1 rounded-full cursor-pointer hover:bg-blue-200 transition-colors duration-100 ease-in-out" 
                    on:click={() => copyToClipboard(`${name}=${option}`, option)}>{option}</button>
            <div class="absolute left-0 mt-2 bg-gray-100 p-2 rounded shadow-lg group-hover:block hidden">
                <pre><span class="text-gray-950">{name}</span>=<span class="text-blue-800">{option}</span></pre>
                <div class="text-xs font-mono">{copyStatus[option] ? 'Copied' : 'Click to Copy'}</div>
            </div>
        </div>
        {/each}
    </div>
    {:else if typeof options === 'string' && options.length > 0}
    <dl class="flex items-center mt-2 relative">
        <dt class="text-sm text-gray-400">Options:</dt>
        <dd class="ml-2 text-sm">{options}</dd>
    </dl>
    {/if}
    {#if defaultValue && defaultValue !== "-"}
    <dl class="flex items-center mt-2">
        <dt class="text-sm text-gray-400">Default:</dt>
        <dd class="ml-2 text-sm">{defaultValue}</dd>
    </dl>
    {/if}
    {#if Array.isArray(type) && type.length > 0}
    <div class="flex items-center mt-2">
        <span class="text-sm text-gray-400">Type:</span>
        {#each type as t, index (t)}
        <span class="ml-2 text-sm bg-blue-100 rounded-full px-2 py-0.5">{t}</span>
        {/each}
    </div>
    {:else if typeof type === 'string' && type.length > 0}
    <dl class="flex items-center mt-2">
        <dt class="text-sm text-gray-400">Type:</dt>
        <dd class="ml-2 text-sm bg-blue-100 rounded-full px-2 py-0.5">{type}</dd>
    </dl>
    {/if}
</div>
</div>
</section>