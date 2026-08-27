export type SupportedLocale = 'en' | 'en-US' | 'it' | 'it-IT' | 'es' | 'es-ES' | 'fr' | 'fr-FR' | 'de' | 'de-DE';

export interface TranslationDict {
	// Date range presets
	today: string;
	yesterday: string;
	last_7_days: string;
	last_14_days: string;
	last_30_days: string;
	last_60_days: string;
	last_90_days: string;
	last_3_months: string;
	last_6_months: string;
	last_12_months: string;
	this_week: string;
	this_month: string;
	this_quarter: string;
	this_year: string;
	previous_week: string;
	previous_month: string;
	previous_quarter: string;
	previous_year: string;
	week_to_date: string;
	month_to_date: string;
	quarter_to_date: string;
	year_to_date: string;
	all_time: string;
	custom: string;
	back_to_presets: string;

	// UI Controls & Tables
	search: string;
	no_results: string;
	loading: string;
	total: string;
	subtotal: string;
	download: string;
	download_csv: string;
	download_image: string;
	fullscreen: string;
	close: string;
	rows_per_page: string;
	page_of: string;
	select_date_range: string;
	language: string;
	select_language: string;
	vs_prior: string;
	copy_link: string;
	copied: string;
}

export const translations: Record<string, TranslationDict> = {
	en: {
		today: 'Today',
		yesterday: 'Yesterday',
		last_7_days: 'Last 7 Days',
		last_14_days: 'Last 14 Days',
		last_30_days: 'Last 30 Days',
		last_60_days: 'Last 60 Days',
		last_90_days: 'Last 90 Days',
		last_3_months: 'Last 3 Months',
		last_6_months: 'Last 6 Months',
		last_12_months: 'Last 12 Months',
		this_week: 'This Week',
		this_month: 'This Month',
		this_quarter: 'This Quarter',
		this_year: 'This Year',
		previous_week: 'Previous Week',
		previous_month: 'Previous Month',
		previous_quarter: 'Previous Quarter',
		previous_year: 'Previous Year',
		week_to_date: 'Week to Date',
		month_to_date: 'Month to Date',
		quarter_to_date: 'Quarter to Date',
		year_to_date: 'Year to Date',
		all_time: 'All Time',
		custom: 'Custom Range',
		back_to_presets: 'Back to presets',
		search: 'Search...',
		no_results: 'No results found',
		loading: 'Loading...',
		total: 'Total',
		subtotal: 'Subtotal',
		download: 'Download',
		download_csv: 'Download CSV',
		download_image: 'Download PNG',
		fullscreen: 'Fullscreen',
		close: 'Close',
		rows_per_page: 'Rows per page',
		page_of: 'Page {page} of {total}',
		select_date_range: 'Select date range',
		language: 'Language',
		select_language: 'Select language',
		vs_prior: 'vs. prior',
		copy_link: 'Copy link',
		copied: 'Copied!'
	},
	it: {
		today: 'Oggi',
		yesterday: 'Ieri',
		last_7_days: 'Ultimi 7 giorni',
		last_14_days: 'Ultimi 14 giorni',
		last_30_days: 'Ultimi 30 giorni',
		last_60_days: 'Ultimi 60 giorni',
		last_90_days: 'Ultimi 90 giorni',
		last_3_months: 'Ultimi 3 mesi',
		last_6_months: 'Ultimi 6 mesi',
		last_12_months: 'Ultimi 12 mesi',
		this_week: 'Questa settimana',
		this_month: 'Questo mese',
		this_quarter: 'Questo trimestre',
		this_year: "Quest'anno",
		previous_week: 'Settimana precedente',
		previous_month: 'Mese precedente',
		previous_quarter: 'Trimestre precedente',
		previous_year: 'Anno precedente',
		week_to_date: "Dall'inizio della settimana",
		month_to_date: "Dall'inizio del mese",
		quarter_to_date: "Dall'inizio del trimestre",
		year_to_date: "Dall'inizio dell'anno",
		all_time: 'Tutto il periodo',
		custom: 'Intervallo personalizzato',
		back_to_presets: 'Torna ai preset',
		search: 'Cerca...',
		no_results: 'Nessun risultato trovato',
		loading: 'Caricamento in corso...',
		total: 'Totale',
		subtotal: 'Subtotale',
		download: 'Scarica',
		download_csv: 'Scarica CSV',
		download_image: 'Scarica PNG',
		fullscreen: 'Schermo intero',
		close: 'Chiudi',
		rows_per_page: 'Righe per pagina',
		page_of: 'Pagina {page} di {total}',
		select_date_range: 'Seleziona intervallo date',
		language: 'Lingua',
		select_language: 'Seleziona lingua',
		vs_prior: 'rispetto al periodo precedente',
		copy_link: 'Copia link',
		copied: 'Copiato!'
	}
};

// Aliases
translations['en-US'] = translations.en;
translations['en-GB'] = translations.en;
translations['it-IT'] = translations.it;
translations['it-CH'] = translations.it;

export const AVAILABLE_LOCALES = [
	{ code: 'en-US', label: 'English', flag: '🇬🇧' },
	{ code: 'it-IT', label: 'Italiano', flag: '🇮🇹' },
	{ code: 'es-ES', label: 'Español', flag: '🇪🇸' },
	{ code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
	{ code: 'fr-FR', label: 'Français', flag: '🇫🇷' }
] as const;
