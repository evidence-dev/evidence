import { enUS } from 'date-fns/locale/en-US';
import type { DateLocale } from '../date-locale';

export const EN_DATE_LOCALE: DateLocale = {
	locale: enUS,
	patterns: {
		month: 'MMM',
		monthYear: 'MMM yyyy',
		quarter: "'Q'Q",
		quarterYear: "'Q'Q yyyy",
		dayMonth: 'MMM d',
		dayMonthYear: 'MMM d, yyyy',
		dayMonthShortYear: "MMM d ''yy",
		hour: 'h aaa',
		dayMonthHour: 'MMM d, h aaa',
		dayMonthYearHour: 'MMM d, yyyy h aaa',
		year: 'yyyy'
	},
	weekRange: {
		sameMonth: '{start:MMM d}–{end:d}, {start:yyyy}',
		crossMonth: '{start:MMM d} – {end:MMM d}, {start:yyyy}',
		crossYear: '{start:MMM d, yyyy} – {end:MMM d, yyyy}'
	}
};
