# Adding a language

Evidence renders the built-in parts of a report — chart date axes and tooltips,
table pagination, filter chips, date pickers, legends, "Download", "Total" and
so on — in the language the viewer selects from the translations menu. Authors
translate their own content in `translations.yaml`; this directory holds the
translations for everything Evidence itself draws.

A language is two files plus one registry line. Nothing else in the codebase
needs to change, and the test suite tells you when the files are complete.

## 1. Date locale — `languages/<code>.ts`

How dates are spelled on chart axes. Copy `languages/fr.ts`:

```ts
import { de } from 'date-fns/locale/de';
import type { DateLocale } from '../date-locale';

export const DE_DATE_LOCALE: DateLocale = {
	locale: de,
	patterns: {
		month: 'MMM', // Juli
		monthYear: 'MMM yyyy', // Juli 2025
		quarter: "'Q'Q", // Q3
		quarterYear: "'Q'Q yyyy", // Q3 2025
		dayMonth: 'd. MMM', // 5. Juli
		dayMonthYear: 'd. MMM yyyy', // 5. Juli 2025
		dayMonthShortYear: 'dd.MM.yy', // 05.07.25 (filter chips)
		hour: "H 'Uhr'", // 16 Uhr
		dayMonthHour: "d. MMM, H 'Uhr'",
		dayMonthYearHour: "d. MMM yyyy, H 'Uhr'",
		year: 'yyyy'
	},
	weekRange: {
		sameMonth: '{start:d}.–{end:d}. {start:MMM yyyy}', // 15.–21. Juni 2025
		crossMonth: '{start:d. MMM} – {end:d. MMM yyyy}', // 29. Juni – 5. Juli 2025
		crossYear: '{start:d. MMM yyyy} – {end:d. MMM yyyy}'
	},
	presets: {
		shortdate: 'd"." mmm yy',
		longdate: 'd"." mmmm yyyy', // 5. Juli 2025
		fulldate: 'dddd, d"." mmmm yyyy',
		hms: 'HH:MM:SS'
	},
	grainFormats: {
		'MMM d, yyyy': 'd"." mmm yyyy',
		'MMM d, yyyy h AM/PM': 'd"." mmm yyyy, H" Uhr"'
	}
};
```

- `locale` is the [date-fns locale](https://github.com/date-fns/date-fns/tree/main/src/locale)
  for the language; it supplies month and weekday names — for the chart
  patterns below and for author-written `fmt` codes (`mmm yyyy`, `dddd`)
  everywhere, so those are localized without further work.
- `presets` (optional) redefines the named `fmt` presets whose shared
  definition is English word order or 12-hour time: `shortdate`, `longdate`,
  `fulldate`, `hms`. French sets `longdate: 'd mmmm yyyy'`; leave out any
  preset that already reads correctly. Any language that is not English
  month-first with a 12-hour clock needs all four.
- `grainFormats` (optional) does the same for the default formats of
  `date_grain` columns in tables and charts (`MMM d, yyyy`,
  `MMM d, yyyy h AM/PM`, `"Q"0`). These are SSF codes like `fmt`, not
  date-fns patterns: quote literal text in double quotes (`d"." mmmm`),
  since SSF reads a bare `.` after a date token as a decimal point and fails.
  The quarter letter in `quarter` / `qq` output comes from `patterns.quarter`
  automatically.
- `patterns` are [date-fns format strings](https://date-fns.org/docs/format),
  one per label shape the chart engine produces. Quote literal text in single
  quotes (`"'T'Q"`). Check what the locale's own tokens give you — French `QQQ`
  yields "3ème trim.", so `fr.ts` spells quarters explicitly.
- `weekRange` templates format a week-long bucket as a range; `{start:…}` and
  `{end:…}` each take a date-fns pattern applied to that end of the range.
- No pattern may contain a newline: the chart engine stacks two-tier labels
  itself.

Prefer the short forms readers expect on a chart axis over what a locale
considers "correct" in prose — labels are measured to decide how many fit, so
long words mean fewer labels.

## 2. UI strings — `messages/<code>.json`

An [i18next](https://www.i18next.com/) resource file — the same library and
format Evidence uses for authors' `translations.yaml`, so translation tools
(Crowdin, Lokalise, Weblate…) import and export it directly. Copy
`messages/en.json`, keep every key, translate every value:

```json
{
	"common.close": "Schließen",
	"table.rows_range": "{{start}} - {{end}} von {{total}} Zeilen",
	"filter.selected_count_one": "{{count}} ausgewählt",
	"filter.selected_count_other": "{{count}} ausgewählt"
}
```

- Keys are flat. `{{name}}` placeholders must match the English entry —
  reorder them freely, but do not drop or rename any.
- Plural families end in `_one` / `_other`. Add every other CLDR category
  your language has (`_zero`, `_two`, `_few`, `_many`); the test suite lists
  any that are missing. French has `_many` (used for exact millions), so its
  files copy `_other` there.
- A file missing an English key fails to type-check, so an incomplete
  translation cannot ship.
- Strings live in fixed-width places — buttons, placeholders, popover
  sidebars — so length matters. The test suite enforces a budget relative to
  the English source (short labels may triple, sentences may grow ~30%) and
  caps `date_preset.*` at 24 characters. When a natural translation is over
  budget, choose a shorter phrasing rather than widening the component; that
  is how English `Any` became French `Aucun`, not `Sans limite`.

## 3. Register it — `registry.ts`

```ts
const LANGUAGES: Record<string, LanguagePack> = {
	en: { dateLocale: EN_DATE_LOCALE, messages: en },
	fr: { dateLocale: FR_DATE_LOCALE, messages: fr },
	de: { dateLocale: DE_DATE_LOCALE, messages: de }
};
```

Keys are lower-case [BCP-47](https://www.rfc-editor.org/rfc/rfc5646) tags.
Viewers who pick `de-AT` are served `de` automatically; add a regional entry
(`pt-br`, `fr-ca`) only when its conventions genuinely differ from the
primary language.

## 4. Check

```bash
pnpm --filter @evidence/core test -- src/locale
pnpm --filter @evidence/core check
```

`date-locale.test.ts` renders every pattern for every registered language and
checks the invariants above (single line, distinct months / quarters / hours,
week ranges resolve). `messages.test.ts` checks key parity with English,
placeholder parity, the length budget, and that each plural family defines
every CLDR category of the language. Then look at it: run `pnpm evd dev` in a project whose `translations.yaml`
has a top-level key for your language, pick it in the language menu, and open
a page with a monthly chart, a table and a date range picker.

## Out of scope

Author content stays in `translations.yaml`. Number formatting (decimal and
thousands separators) is a project setting, not part of the language pack.
