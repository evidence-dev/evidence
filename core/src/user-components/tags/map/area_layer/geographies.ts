// Standard geographies hosted on geo.evidence.work
// Note: For us_counties, STATE_NAME and STATE_ABBREV are computed at runtime
// from the STATE FIPS code (see state-fips.ts). This allows users to use
// geojson_composite_id=["STATE_NAME", "NAME"] for user-friendly matching.
export const GEOGRAPHIES = {
	us_states: {
		url: 'https://geo.evidence.work/us_states_5m.json',
		geojson_id: 'NAME' // State names are unique, safe to use NAME
	},
	us_counties: {
		url: 'https://geo.evidence.work/us_counties_5m.json',
		geojson_id: 'GEO_ID' // Full Census GEOID (e.g., "0500000US04003") - fallback default
	}
} as const;

export type GeographyName = keyof typeof GEOGRAPHIES;
