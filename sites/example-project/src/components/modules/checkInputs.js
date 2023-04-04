export default function checkInputs(data, reqCols, optCols) {
	// reqCols is an array of columns to check in the dataset
	let columns = [];

	// Check if dataset was provided
	if (data == undefined) {
		throw Error('No dataset provided');
	} else if (typeof data !== 'object') {
		throw Error(
			"'" +
				data +
				"'" +
				' is not a recognized query result. Data should be provided in the format: data = {' +
				data.replace('data.', '') +
				'}'
		);
	} else if (data[0] == undefined) {
		throw Error(
			'Dataset is empty: query ran successfully, but no data was returned from the database'
		);
	}

	// Check if data warehouse returned an error
	if (data[0]?.error_object?.error != null) {
		throw Error('SQL Error: ' + data[0]?.error_object?.error?.message);
	}

	if (reqCols != undefined) {
		if (!(reqCols instanceof Array)) {
			throw Error('reqCols must be passed in as an array');
		}

		// Check if columns were provided
		// let missingCols = [];
		for (var i = 0; i < reqCols.length; i++) {
			if (reqCols[i] == null) {
				// missingCols.push(reqCols[i]);
				throw Error('Missing required columns');
			}
		}

		// let errorString;
		// if(missingCols.length > 0){
		//     errorString = missingCols[0]
		//     for(i = 1; i < missingCols.length; i++){
		//         errorString = errorString + ", " + missingCols[i];
		//     }
		//     errorString = errorString + " not provided";
		//     throw Error(errorString);
		// }

		// Get list of all columns in dataset
		for (const [key] of Object.entries(data[0])) {
			columns.push(key);
		}

		// Check if provided columns are in the dataset
		let currentCol;
		for (i = 0; i < reqCols.length; i++) {
			currentCol = reqCols[i];
			if (!columns.includes(currentCol)) {
				throw Error("'" + currentCol + "' is not a column in the dataset");
			}
		}

		if (optCols != undefined && optCols[0] != null) {
			for (i = 0; i < optCols.length; i++) {
				currentCol = optCols[i];
				if (!columns.includes(currentCol)) {
					throw Error("'" + currentCol + "' is not a column in the dataset");
				}
			}
		}
	}
	// IDEAS:
	// Trigger a function call when error is caught - that function somehow sends us to the Error chart component
	// rather than letting the rest of the current component file continue running?
	// Almost 2 layers of error: (1) up front check errors and (2) actual execution of the chart errors
	// (1) is handled here, (2) may need a wrapper around the main part of the component code
}
