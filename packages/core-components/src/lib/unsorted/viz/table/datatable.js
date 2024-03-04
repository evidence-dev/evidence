import { strictBuild } from '@evidence-dev/component-utilities/chartContext';

/**
* Will find the matching column in columnSummary or throw an error if not found
* @param column
*/
export function safeExtractColumn(column, columnSummary) {
   const foundCols = columnSummary.filter((d) => d.id === (column.id));
   if (foundCols === undefined || foundCols.length !== 1) {
       const error =
           column.id === undefined
               ? new Error(`please add an "id" property to all the <Column ... />`)
               : new Error(`column with id: "${column.id}" not found`);
       if (strictBuild) {
           throw error;
       }
       console.warn(error.message);
       return '';
   }

   return foundCols[0];
}


export function weightedMean(data, valueCol, weightCol) {
    let totalWeightedValue = 0;
    let totalWeight = 0;

    data.forEach((item) => {
        const value = Number(item[valueCol]);
        const weight = Number(item[weightCol] || 1); // Default to 1 if weightCol is not specified or missing in the item
        totalWeightedValue += value * weight;
        totalWeight += weight;
    });

    return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
};


export function median(data, column) {
    // Extract the relevant values and filter out undefined or non-numeric values
    const values = data.map(item => item[column]).filter(val => val !== undefined && !isNaN(val)).sort((a, b) => a - b);
    
    if (values.length === 0) return 0; // Return 0 or another placeholder if no valid values exist

    const midIndex = Math.floor(values.length / 2);

    // If odd number of values, return the middle one; if even, return the average of the two middle values
    return values.length % 2 !== 0 ? values[midIndex] : (values[midIndex - 1] + values[midIndex]) / 2;
}
