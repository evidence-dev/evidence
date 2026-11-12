import { fr } from 'date-fns/locale/fr';
import type { DateLocale } from '../date-locale';

// date-fns' `fr` ships the CLDR abbreviations ("janv.", "juil.", "sept.").
// Quarters are spelled out explicitly: its `QQQ` yields "3ème trim.", not the
// "T3" (trimestre) form used on French charts.
export const FR_DATE_LOCALE: DateLocale = {
	locale: fr,
	patterns: {
		month: 'MMM',
		monthYear: 'MMM yyyy',
		quarter: "'T'Q",
		quarterYear: "'T'Q yyyy",
		dayMonth: 'd MMM',
		dayMonthYear: 'd MMM yyyy',
		dayMonthShortYear: 'd MMM yyyy',
		hour: "H 'h'",
		dayMonthHour: "d MMM H 'h'",
		dayMonthYearHour: "d MMM yyyy H 'h'",
		year: 'yyyy'
	},
	weekRange: {
		sameMonth: '{start:d}–{end:d} {start:MMM yyyy}',
		crossMonth: '{start:d MMM} – {end:d MMM yyyy}',
		crossYear: '{start:d MMM yyyy} – {end:d MMM yyyy}'
	},
	presets: {
		shortdate: 'd mmm yy',
		longdate: 'd mmmm yyyy',
		fulldate: 'dddd d mmmm yyyy',
		hms: 'HH:MM:SS'
	},
	grainFormats: {
		'MMM d, yyyy': 'd mmm yyyy',
		'MMM d, yyyy h AM/PM': 'd mmm yyyy H" h"',
		'"Q"0': '"T"0'
	}
};
