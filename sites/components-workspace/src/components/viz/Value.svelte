<script>
    import getColumnSummary from "../modules/getColumnSummary.js";
    import formatValue from "../modules/formatValue.js";
    import getParsedDate from "../modules/getParsedDate.js";
    let fmt = null
    let units = null
    
    export let data = null 
    export let row = 0    
    export let column = null

    export let value = null

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
        fmt = columnSummary[0].format;
        units = columnSummary[0].units;
    }
    
</script>

{formatValue(value, fmt, units)} 
