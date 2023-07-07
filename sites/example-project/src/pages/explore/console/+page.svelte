<script>
    import {DataTable} from "@evidence-dev/core-components"

	export let data;
	let { __db: db } = data;

    let sql_query, results = [], loading
    async function run() {
        loading = true
        results = await db.query(sql_query)
        loading = false
    }

    let input

</script>

<div class="container mx-auto relative font-mono bg-black rounded-xl" 
    on:click={() => input.focus()}
    on:keypress={e => e.key === 'Enter' && (e.getModifierState('Control')) && run()}
    >
    <h3 class="mx-4 py-4 m-0 text-white select-none font-mono">Query Console</h3>
	<hr class="m-0 w-full border-white/30"/>
	<textarea
		class="mt-4 px-4 pb-1 min-h-[100px] outline-none focus:outline-0 resize-none w-full bg-black text-white text-sm"
		bind:value={sql_query}
        bind:this={input}
	/>
	<div class="block ml-auto pr-4 py-4">
    <button class="block ml-auto bg-green-600 hover:bg-green-700 active:bg-green-800 transition-colors px-4 py-2 text-sm text-white rounded-xl select-none" 
    on:click|preventDefault={() => run()}
    disabled={loading}
    class:!bg-green-900={loading}
	>
        Run Query
    </button>
	</div>
</div>

<DataTable data={results} rowShading/>