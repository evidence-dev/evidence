<script>
    export let fmt = null
    
    export let data = null 
    export let row = 0    
    export let column = null

    export let value = null

    if(data) {
        if(!column){
            column = Object.keys(data[row])[0]
        }
        value = data[row][column]

        let fmt_stub = column.substr(column.length - 4) 

        if(fmt_stub.substr(0,1) === '_' ){
            fmt = fmt_stub.substr(1)
        }
        else if(column.includes("_date")){
            fmt = "date"
        }
    }
    
</script>

{#if fmt === "pct"}
{value.toLocaleString(undefined, { style: 'percent' })}
{:else if fmt === "usd" }
{value.toLocaleString('en-US',{style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2})}
{:else if fmt === "date"}
{(new Date (value)).toLocaleDateString('en-US',{ year: 'numeric', month: 'long', day: 'numeric' })}
{:else }
{value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
{/if}