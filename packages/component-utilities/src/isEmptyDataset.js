export default function isEmptyDataset(data, emptySet) {
    if (data[0] === undefined || data.length === 0) {
        if(emptySet === 'error'){
            throw Error(
                'Dataset is empty: query ran successfully, but no data was returned from the database'
            );    
        } else if(emptySet === 'warn'){
            console.warn('Dataset is empty: query ran successfully, but no data was returned from the database')
            return true;
        } else {
            return true;
        }
	}
}
