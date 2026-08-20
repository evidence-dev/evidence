export default function formatTitle(
	column: string | undefined,
	grain?: string,
	periodCount: number = 1, // Defaults to a single period when not provided
	comparisonName?: string, // Custom comparison name (e.g., "vs. Franchisees") for benchmark/target titles
	isUserProvidedAlias?: boolean // When true, preserve the alias as-is (skip parentheses→"of" etc.)
) {
	// Return empty string if column is undefined or null
	if (column === undefined || column === null) {
		return '';
	}

	// If the user explicitly provided an alias via AS, preserve it with minimal cleanup
	if (isUserProvidedAlias) {
		const trimmed = column.trim();
		// Only strip quotes if they form a matching pair (same quote at start and end)
		const firstChar = trimmed[0];
		const lastChar = trimmed[trimmed.length - 1];
		if ((firstChar === '"' || firstChar === "'" || firstChar === '`') && firstChar === lastChar) {
			return trimmed.slice(1, -1);
		}
		return trimmed;
	}

	// Allow some acronyms to remain fully capitalized in titles:
	const acronyms = [
		// Identifiers
		'id',

		// Financial performance
		'gdp',
		'ttm',
		'ltm',
		'ebit',
		'ebitda',
		'roi',
		'npv',
		'irr',
		'wacc',
		'fcf',
		'cagr',
		'gm',
		'cogs',
		'eps',
		'aum',

		// Revenue & sales metrics
		'arr',
		'mrr',
		'acv',
		'aov',
		'ltv',
		'cac',
		'gmv',

		// Marketing & funnel
		'ctr',
		'cta',
		'cpc',
		'cpm',
		'ppc',
		'cvr',
		'nps',
		'csat',
		'sql',
		'mql',
		'clv',
		'cpl',

		// Time-based comparisons
		'mtd',
		'wtd',
		'qtd',
		'ytd',
		'mom',
		'qoq',
		'yoy',
		'l12m',
		'l6m',
		'l3m',
		'l30d',
		'l7d',

		// Operations / execution metrics
		'sla',
		'tco',
		'otd',

		// Strategic / planning
		'kpi',
		'okr',
		'gtm',

		// Healthcare
		'mh', // Mental Health
		'pc', // Primary Care
		'eap', // Employee Assistance Program
		'mso', // Medical Second Opinion
		'icbt' // Internet-based Cognitive Behavioral Therapy
	];

	// Allow some joining words to remain fully lowercased in title:
	const lowercase = ['of', 'the', 'and', 'in', 'on'];

	// Set name to proper casing:
	function toTitleCase(str: string) {
		return str.replace(/\S*/g, function (txt) {
			if (!acronyms.includes(txt) && !lowercase.includes(txt)) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			} else if (acronyms.includes(txt)) {
				return txt.toUpperCase();
			} else {
				return txt.toLowerCase();
			}
		});
	}

	// Strip quotes, turn underscores into spaces, parens into "of", then title-case.
	function humanize(str: string) {
		return toTitleCase(
			str
				.trim()
				.replace(/"/g, '')
				.replace(/_+/g, ' ')
				.replace(/\(/g, ' of ')
				.replace(/\)/g, ' ')
		).trim();
	}

	// Handle comparison columns before stripping __ev_ prefix.
	// Match case-insensitively because Snowflake folds unquoted identifiers
	// to uppercase, so the same column comes back as __EV_*_COMPARISON_*.
	const lowerColumn = column.toLowerCase();
	if (lowerColumn.startsWith('__ev_') && lowerColumn.includes('_comparison')) {
		// Match pattern: __ev_measure_name_comparison_type_suffix
		const comparisonMatch = lowerColumn.match(
			/^__ev_(.+?)_(prior_year|prior_period|target|benchmark(?:_[a-z]+)?)_comparison(?:_(pct|abs|compared_value))?$/
		);

		if (comparisonMatch) {
			const [, measureName, comparisonType, suffix] = comparisonMatch;

			const formattedMeasure = humanize(measureName);

			// Handle different comparison types and suffixes
			if (comparisonType === 'prior_year') {
				if (suffix === 'pct') {
					return `${formattedMeasure} % YoY`;
				} else if (suffix === 'abs') {
					return `${formattedMeasure} Δ YoY`;
				} else if (suffix === 'compared_value') {
					return `${formattedMeasure} PY`;
				} else {
					return `${formattedMeasure} YoY`;
				}
			} else if (comparisonType === 'prior_period') {
				// Map grain to period abbreviations when available (single-unit only)
				const grainMap = {
					day: 'DoD',
					week: 'WoW',
					month: 'MoM',
					quarter: 'QoQ',
					year: 'YoY'
				};

				// Determine if we should use the shorthand (MoM, QoQ, etc.) — only for single-unit comparisons
				const isSingleUnit = periodCount === 1;
				const hasAbbrev = isSingleUnit && grain && grainMap[grain as keyof typeof grainMap];
				const periodLabel = hasAbbrev
					? grainMap[grain as keyof typeof grainMap]
					: 'vs Prior Period';

				if (suffix === 'pct') {
					return `${formattedMeasure} % ${periodLabel}`;
				} else if (suffix === 'abs') {
					return `${formattedMeasure} Δ ${periodLabel}`;
				} else if (suffix === 'compared_value') {
					return hasAbbrev
						? `${formattedMeasure} Prior ${grain?.[0]?.toUpperCase() + grain?.slice(1)}`
						: `${formattedMeasure} Prior Period`;
				} else {
					return hasAbbrev
						? `${formattedMeasure} ${periodLabel.replace('%', '').replace('Δ', '').trim()}`
						: `${formattedMeasure} vs Prior Period`;
				}
			} else if (comparisonType === 'target') {
				// Use custom comparison name if provided, otherwise default to "Target"
				const targetLabel = comparisonName || 'vs Target';
				if (suffix === 'target') {
					return `${formattedMeasure} ${comparisonName || 'Target'}`;
				} else if (suffix === 'abs') {
					return `${formattedMeasure} Δ ${targetLabel}`;
				} else if (suffix === 'pct') {
					return `${formattedMeasure} % ${targetLabel}`;
				} else {
					return `${formattedMeasure} ${targetLabel}`;
				}
			} else if (comparisonType.startsWith('benchmark')) {
				// Handle benchmark comparisons: benchmark_avg, benchmark_median, etc.
				// Use custom comparison name if provided, otherwise default to "Benchmark"
				const benchmarkLabel = comparisonName || 'Benchmark';
				if (suffix === 'compared_value') {
					return `${formattedMeasure} ${benchmarkLabel}`;
				} else if (suffix === 'abs') {
					return `${formattedMeasure} Δ ${benchmarkLabel}`;
				} else if (suffix === 'pct') {
					return `${formattedMeasure} % ${benchmarkLabel}`;
				} else {
					return `${formattedMeasure} ${benchmarkLabel}`;
				}
			}
		}
	}

	// Strip __ev_ prefix from column names (internal helper columns).
	// Case-insensitive because Snowflake folds unquoted identifiers to uppercase.
	let processedColumn = column;
	if (processedColumn.toLowerCase().startsWith('__ev_')) {
		processedColumn = processedColumn.slice('__ev_'.length);
	}

	// Handle FILTER WHERE date range patterns
	const filterMatch = processedColumn.match(
		/^(.+?)\s+FILTER\s+\(\s*WHERE\s+.+?\s*>=\s*date_sub\s*\(\s*MONTH,\s*(\d+),/i
	);
	if (filterMatch) {
		const baseMeasure = filterMatch[1].trim();
		const months = parseInt(filterMatch[2]);

		const formattedBaseMeasure = humanize(baseMeasure);

		// Convert months to readable format
		const monthsLabel =
			months === 12
				? 'Last 12 Months'
				: months === 6
					? 'Last 6 Months'
					: months === 3
						? 'Last 3 Months'
						: `Last ${months} Months`;

		return `${formattedBaseMeasure} (${monthsLabel})`;
	}

	// Handle other date_sub patterns (days, weeks, etc.)
	const filterDayMatch = processedColumn.match(
		/^(.+?)\s+FILTER\s+\(\s*WHERE\s+.+?\s*>=\s*date_sub\s*\(\s*DAY,\s*(\d+),/i
	);
	if (filterDayMatch) {
		const baseMeasure = filterDayMatch[1].trim();
		const days = parseInt(filterDayMatch[2]);

		const formattedBaseMeasure = humanize(baseMeasure);

		// Convert days to readable format
		const daysLabel =
			days === 30 ? 'Last 30 Days' : days === 7 ? 'Last 7 Days' : `Last ${days} Days`;

		return `${formattedBaseMeasure} (${daysLabel})`;
	}

	// Handle year-to-date, month-to-date patterns
	const filterYTDMatch = processedColumn.match(
		/^(.+?)\s+FILTER\s+\(\s*WHERE\s+.+?\s*>=\s*toStartOfYear\s*\(/i
	);
	if (filterYTDMatch) {
		const formattedBaseMeasure = humanize(filterYTDMatch[1]);
		return `${formattedBaseMeasure} (Year to Date)`;
	}

	const filterMTDMatch = processedColumn.match(
		/^(.+?)\s+FILTER\s+\(\s*WHERE\s+.+?\s*>=\s*toStartOfMonth\s*\(/i
	);
	if (filterMTDMatch) {
		const formattedBaseMeasure = humanize(filterMTDMatch[1]);
		return `${formattedBaseMeasure} (Month to Date)`;
	}

	const filterWTDMatch = processedColumn.match(
		/^(.+?)\s+FILTER\s+\(\s*WHERE\s+.+?\s*>=\s*toStartOfWeek\s*\(/i
	);
	if (filterWTDMatch) {
		const formattedBaseMeasure = humanize(filterWTDMatch[1]);
		return `${formattedBaseMeasure} (Week to Date)`;
	}

	// Snowflake DATE_TRUNC variants of the FILTER WHERE date range patterns
	const filterSnowflakeTruncMatch = processedColumn.match(
		/^(.+?)\s+FILTER\s+\(\s*WHERE\s+.+?\s*>=\s*DATE_TRUNC\s*\(\s*'(YEAR|MONTH|WEEK)'/i
	);
	if (filterSnowflakeTruncMatch) {
		const formattedBaseMeasure = humanize(filterSnowflakeTruncMatch[1]);
		const unit = filterSnowflakeTruncMatch[2].toUpperCase();
		const label = unit === 'YEAR' ? 'Year to Date' : unit === 'MONTH' ? 'Month to Date' : 'Week to Date';
		return `${formattedBaseMeasure} (${label})`;
	}

	// Handle aliased date granularity functions (from our auto-generated aliases)
	// Match patterns like "tostartofmonth_date", "tostartofweek_created_at", etc.
	const aliasedDateGrainMatch = processedColumn.match(
		/^tostartof(day|week|month|quarter|year|hour)_(.+)$/i
	);
	if (aliasedDateGrainMatch) {
		const granularity = aliasedDateGrainMatch[1].toLowerCase();
		const columnName = aliasedDateGrainMatch[2];

		// Special case: use "date" instead of "day" for day granularity
		const replacementWord = granularity === 'day' ? 'date' : granularity;

		// For common date column names, just use the granularity
		// For other columns, use "Granularity of Column"
		if (/^(date|datetime|timestamp|created_at|updated_at)$/i.test(columnName)) {
			return toTitleCase(replacementWord).trim();
		} else {
			const cleanColumnName = columnName.replace(/_/g, ' ');
			return toTitleCase(`${replacementWord} of ${cleanColumnName}`).trim();
		}
	}

	// Handle ClickHouse date granularity functions (original syntax)
	// First try toStartOf functions (including Hour)
	const dateGrainMatch = processedColumn.match(
		/toStartOf(Day|Week|Month|Quarter|Year|Hour)\(([^)]+)\)/i
	);
	if (dateGrainMatch) {
		const granularity = dateGrainMatch[1].toLowerCase();
		const parameter = dateGrainMatch[2].trim();

		// Special case: use "date" instead of "day" for toStartOfDay
		const replacementWord = granularity === 'day' ? 'date' : granularity;

		// Replace time-related words with the appropriate replacement in the parameter
		const processedParameter = parameter.replace(
			/\b(date|datetime|timestamp)\b/gi,
			replacementWord
		);

		return humanize(processedParameter);
	}

	// Snowflake DATE_TRUNC('UNIT', col) equivalent of the toStartOf* patterns
	const snowflakeDateTruncMatch = processedColumn.match(
		/DATE_TRUNC\(\s*'(DAY|WEEK|MONTH|QUARTER|YEAR|HOUR)'\s*,\s*([^)]+)\)/i
	);
	if (snowflakeDateTruncMatch) {
		const granularity = snowflakeDateTruncMatch[1].toLowerCase();
		const parameter = snowflakeDateTruncMatch[2].trim();

		const replacementWord = granularity === 'day' ? 'date' : granularity;

		const processedParameter = parameter.replace(
			/\b(date|datetime|timestamp)\b/gi,
			replacementWord
		);

		return humanize(processedParameter);
	}

	// Handle the new date part extraction functions
	const datePartMatch = processedColumn.match(
		/(toDayOfWeek|toDayOfMonth|toDayOfYear|toWeek|toMonth|toQuarter)\(([^)]+)\)/i
	);
	if (datePartMatch) {
		const functionName = datePartMatch[1];
		const parameter = datePartMatch[2].trim();

		// Map function names to readable titles
		const functionTitles = {
			toDayOfWeek: 'Day of Week',
			toDayOfMonth: 'Day of Month',
			toDayOfYear: 'Day of Year',
			toWeek: 'Week of Year',
			toMonth: 'Month of Year',
			toQuarter: 'Quarter of Year'
		};

		const title = functionTitles[functionName as keyof typeof functionTitles];

		// Clean up the parameter and combine with function title
		const cleanParameter = parameter.replace(/\b(date|datetime|timestamp)\b/gi, '').trim();
		if (cleanParameter && cleanParameter !== '') {
			return `${title} of ${toTitleCase(cleanParameter.replace(/"/g, '').replace(/_/g, ' '))}`.trim();
		} else {
			return title;
		}
	}

	// Snowflake date part extraction equivalents
	const snowflakeDatePartMatch = processedColumn.match(
		/(DAYOFWEEK|DAYOFMONTH|DAYOFYEAR|WEEKOFYEAR|MONTHNAME|MONTH|QUARTER)\(([^)]+)\)/i
	);
	if (snowflakeDatePartMatch) {
		const functionName = snowflakeDatePartMatch[1].toUpperCase();
		const parameter = snowflakeDatePartMatch[2].trim();

		const functionTitles: Record<string, string> = {
			DAYOFWEEK: 'Day of Week',
			DAYOFMONTH: 'Day of Month',
			DAYOFYEAR: 'Day of Year',
			WEEKOFYEAR: 'Week of Year',
			MONTHNAME: 'Month of Year',
			MONTH: 'Month of Year',
			QUARTER: 'Quarter of Year'
		};

		const title = functionTitles[functionName];

		const cleanParameter = parameter.replace(/\b(date|datetime|timestamp)\b/gi, '').trim();
		if (cleanParameter && cleanParameter !== '') {
			return `${title} of ${toTitleCase(cleanParameter.replace(/"/g, '').replace(/_/g, ' '))}`.trim();
		} else {
			return title;
		}
	}

	return humanize(processedColumn);
}
