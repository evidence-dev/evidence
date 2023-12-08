import inferColumnTypes from './inferColumnTypes';

export default function getColumnEvidenceType(data, column) {
	let item;
	if (data) {
		if (data._evidenceColumnTypes) {
			let columnTypes = data._evidenceColumnTypes;
			return columnTypes.find((item) => item.name?.toLowerCase() === column?.toLowerCase());
		}
		if (Array.isArray(data) && data.length > 0) {
			item = data[0];
		} else {
			item = data;
		}
		if (item && item['_evidenceColumnTypes']) {
			let columnTypes = item['_evidenceColumnTypes'];
			return columnTypes.find((item) => item.name?.toLowerCase() === column?.toLowerCase());
		} else {
			// infer types as a fall-back (when someone is passing arbitrary data objects)
			let columnTypes = inferColumnTypes(data);
			return columnTypes.find((item) => item.name?.toLowerCase() === column?.toLowerCase());
		}
	}

	return null;
}
