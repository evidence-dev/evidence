const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

function dateToYYYYMMDD(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatDateString(date) {
	if (typeof date === 'string' && YYYYMMDD.test(date)) {
		return date;
	} else if (date instanceof Date) {
		return dateToYYYYMMDD(date);
	} else {
		return dateToYYYYMMDD(new Date());
	}
}

export { dateToYYYYMMDD, formatDateString };
