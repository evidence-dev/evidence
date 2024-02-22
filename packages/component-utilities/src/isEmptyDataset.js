export default function isEmptyDataset(data) {
    if (data === undefined || data[0] === undefined || data.length === 0) {
        return true;
	} else {
        return false;
    }
}