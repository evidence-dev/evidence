// State FIPS code lookups for enriching GeoJSON features at runtime
// Source: US Census Bureau

export const STATE_FIPS_TO_NAME: Record<string, string> = {
	'01': 'Alabama',
	'02': 'Alaska',
	'04': 'Arizona',
	'05': 'Arkansas',
	'06': 'California',
	'08': 'Colorado',
	'09': 'Connecticut',
	'10': 'Delaware',
	'11': 'District of Columbia',
	'12': 'Florida',
	'13': 'Georgia',
	'15': 'Hawaii',
	'16': 'Idaho',
	'17': 'Illinois',
	'18': 'Indiana',
	'19': 'Iowa',
	'20': 'Kansas',
	'21': 'Kentucky',
	'22': 'Louisiana',
	'23': 'Maine',
	'24': 'Maryland',
	'25': 'Massachusetts',
	'26': 'Michigan',
	'27': 'Minnesota',
	'28': 'Mississippi',
	'29': 'Missouri',
	'30': 'Montana',
	'31': 'Nebraska',
	'32': 'Nevada',
	'33': 'New Hampshire',
	'34': 'New Jersey',
	'35': 'New Mexico',
	'36': 'New York',
	'37': 'North Carolina',
	'38': 'North Dakota',
	'39': 'Ohio',
	'40': 'Oklahoma',
	'41': 'Oregon',
	'42': 'Pennsylvania',
	'44': 'Rhode Island',
	'45': 'South Carolina',
	'46': 'South Dakota',
	'47': 'Tennessee',
	'48': 'Texas',
	'49': 'Utah',
	'50': 'Vermont',
	'51': 'Virginia',
	'53': 'Washington',
	'54': 'West Virginia',
	'55': 'Wisconsin',
	'56': 'Wyoming',
	// Territories
	'60': 'American Samoa',
	'66': 'Guam',
	'69': 'Northern Mariana Islands',
	'72': 'Puerto Rico',
	'78': 'Virgin Islands'
};

export const STATE_FIPS_TO_ABBREV: Record<string, string> = {
	'01': 'AL',
	'02': 'AK',
	'04': 'AZ',
	'05': 'AR',
	'06': 'CA',
	'08': 'CO',
	'09': 'CT',
	'10': 'DE',
	'11': 'DC',
	'12': 'FL',
	'13': 'GA',
	'15': 'HI',
	'16': 'ID',
	'17': 'IL',
	'18': 'IN',
	'19': 'IA',
	'20': 'KS',
	'21': 'KY',
	'22': 'LA',
	'23': 'ME',
	'24': 'MD',
	'25': 'MA',
	'26': 'MI',
	'27': 'MN',
	'28': 'MS',
	'29': 'MO',
	'30': 'MT',
	'31': 'NE',
	'32': 'NV',
	'33': 'NH',
	'34': 'NJ',
	'35': 'NM',
	'36': 'NY',
	'37': 'NC',
	'38': 'ND',
	'39': 'OH',
	'40': 'OK',
	'41': 'OR',
	'42': 'PA',
	'44': 'RI',
	'45': 'SC',
	'46': 'SD',
	'47': 'TN',
	'48': 'TX',
	'49': 'UT',
	'50': 'VT',
	'51': 'VA',
	'53': 'WA',
	'54': 'WV',
	'55': 'WI',
	'56': 'WY',
	// Territories
	'60': 'AS',
	'66': 'GU',
	'69': 'MP',
	'72': 'PR',
	'78': 'VI'
};

// Reverse lookup: state name → abbreviation
export const STATE_NAME_TO_ABBREV: Record<string, string> = Object.fromEntries(
	Object.entries(STATE_FIPS_TO_NAME).map(([fips, name]) => [name, STATE_FIPS_TO_ABBREV[fips]])
);

// Reverse lookup: state name → FIPS
export const STATE_NAME_TO_FIPS: Record<string, string> = Object.fromEntries(
	Object.entries(STATE_FIPS_TO_NAME).map(([fips, name]) => [name, fips])
);

/**
 * Enrich GeoJSON features with computed state name and abbreviation.
 * Works for both county features (have STATE FIPS) and state features (have NAME).
 */
export function enrichFeaturesWithStateInfo(features: GeoJSON.Feature[]): void {
	for (const feature of features) {
		if (!feature.properties) continue;

		const stateFips = feature.properties.STATE as string | undefined;
		const stateName = feature.properties.NAME as string | undefined;

		if (stateFips) {
			// County features: compute from STATE FIPS code
			feature.properties.STATE_NAME = STATE_FIPS_TO_NAME[stateFips] ?? stateFips;
			feature.properties.STATE_ABBREV = STATE_FIPS_TO_ABBREV[stateFips] ?? stateFips;
		} else if (stateName && STATE_NAME_TO_ABBREV[stateName]) {
			// State features: compute from NAME (the state name)
			feature.properties.STATE_ABBREV = STATE_NAME_TO_ABBREV[stateName];
			feature.properties.STATE = STATE_NAME_TO_FIPS[stateName];
		}
	}
}
