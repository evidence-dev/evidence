import { tidy, mutate } from '@tidyjs/tidy';

export function standardizeDateString(date) {
	if (date && typeof date === 'string') {
		// Parses an individual string into a JS date object

		let dateSplit = date.split(' ');

		// If date doesn't contain timestamp, add one at midnight (avoids timezone interpretation issue)
		if (!date.includes(':')) {
			date = date + 'T00:00:00';
		}

		// Remove any character groups beyond 2 (date and time):
		if (dateSplit.length > 2) {
			date = dateSplit[0] + ' ' + dateSplit[1];
		}

		// Replace microseconds if needed:
		const re = /\.([^\s]+)/;
		date = date.replace(re, '');

		// Remove "Z" to avoid timezone interpretation issue:
		date = date.replace('Z', '');

		// Replace spaces with "T" to conform to ECMA standard:
		date = date.replace(' ', 'T');
	}

	return date;
}

export function convertColumnToDate(data, column) {
	// Replaces a date column's string values with JS date objects, using the standardizeDateString function

	data = tidy(
		data,
		mutate({
			[column]: (d) => {

				const raw = d[column]
				if (raw === null | raw === '') return null
				const standardized = standardizeDateString(raw)
				const date = new Date(standardized)

				return isNan(date.getTime()) ? null : date
			}
		})
	);

	return data;
}

export function standardizeDateColumn(data, column) {
	// Replaces a date column's string values with standardized date strings, using the standardizeDateString function
	// Used in Chart.svelte, where using Date objects leads to errors

	data = tidy(data, mutate({
		[column]: (d) => {

			const raw = d[column]
			if (raw === null | raw === '') return null
			const standardized = standardizeDateString(raw)
			const date = new Date(standardized)

			return isNan(date.getTime()) ? null : date
		}
	}));

	return data;
}
