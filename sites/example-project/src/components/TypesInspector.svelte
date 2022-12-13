<script>
    import getColumnSummary from '$lib/modules/getColumnSummary.js';
 
    export let originalData 
    export let data 
    export let queryName 

    let evidenceTypedData = [];
    let columnTypes
    
    if (originalData) {
        columnTypes = data.evidencemeta?.queries?.find(query => query.id === queryName)?.columnTypes;
        for (let i = 0; i < originalData.length; i++) {
            let nextItem = {...originalData[i]};
            if (nextItem && columnTypes) {
                if (!nextItem.hasOwnProperty('_evidenceColumnTypes')) {
                    Object.defineProperty(nextItem, '_evidenceColumnTypes', {
                        enumerable: false,
                        value: columnTypes,
                    });
                }
            }
            evidenceTypedData.push(nextItem);
        }
    }

    let before = getColumnSummary(originalData)
    let after = getColumnSummary(evidenceTypedData)

</script>

<h2>
Column Summary Before: 
</h2>

{JSON.stringify(before)}

<h2>
Column Summary After: 
</h2>

{JSON.stringify(after)}
