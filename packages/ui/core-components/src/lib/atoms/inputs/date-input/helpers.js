const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convert DateValue to Date
 * @param {import('@internationalized/date').DateValue} dateValue
 * @returns Date
 */
function dateValueToDate(dateValue) {
	return dateValue.toDate('utc');
}

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

export { dateToYYYYMMDD, dateValueToDate, formatDateString };
