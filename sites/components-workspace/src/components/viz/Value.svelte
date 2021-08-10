<script>
    import getColumnSummary from "../modules/getColumnSummary.js";
    import formatValue from "../modules/formatValue.js";
    import getParsedDate from "../modules/getParsedDate.js";
    
    // Passing in value from dataset:
    export let data = null 
    export let row = 0    
    export let column = null

    // Passing in single value directly:
    export let value = null

    // Overrides for format and units:
    export let fmt = null
    let units = null

    if(data) {
        if(!column){
            column = Object.keys(data[row])[0]
        }
        let columnSummary = getColumnSummary(data);

        let dateCols = columnSummary.filter(d => d.type === "date")
        dateCols = dateCols.map(d => d.id);
        if(dateCols.length > 0){
            for(var i = 0; i < dateCols.length; i++){
            data = getParsedDate(data, dateCols[i]);
            }
        }
        value = data[row][column]
        columnSummary = columnSummary.filter(d => d.id === column);

        if(fmt == null){
            fmt = columnSummary[0].format;
        }

        // Units (k, M, B) - not used in <Value> yet:
        // units = columnSummary[0].units;
    } else {
        value = isNaN(value) ? value : Number.parseFloat(value);
        if(fmt == null){
            fmt = (typeof value === "number" ? "num" : "str");
        }
    }
    
</script>

{formatValue(value, fmt)} 
