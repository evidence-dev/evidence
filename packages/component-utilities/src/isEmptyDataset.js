/**
 * @param {unknown} data
 * @returns {boolean}
 */
export default function isEmptyDataset(data) {
	if (!data || !data[0] || !data.length) {
		return true;
	} else {
		return false;
	}
}
