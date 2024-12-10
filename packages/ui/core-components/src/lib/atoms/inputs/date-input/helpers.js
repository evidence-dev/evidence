const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

function dateToYYYYMMDD(date) {
	return date.toISOString().split('T')[0];
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
