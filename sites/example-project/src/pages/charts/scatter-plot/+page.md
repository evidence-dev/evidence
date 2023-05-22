<script>

let regions = [
    {region: 'West', score_a: 59, score_b: 51},
    {region: 'West', score_a: 70, score_b: 43},
    {region: 'West', score_a: 72, score_b: 38},
    {region: 'West', score_a: 66, score_b: 34},
    {region: 'West', score_a: 59, score_b: 48},
    {region: 'West', score_a: 66, score_b: 34},
    {region: 'West', score_a: 62, score_b: 30},
    {region: 'West', score_a: 58, score_b: 32},
    {region: 'West', score_a: 51, score_b: 35},
    {region: 'West', score_a: 51, score_b: 52},
    {region: 'West', score_a: 59, score_b: 35},
    {region: 'West', score_a: 47, score_b: 37},
    {region: 'West', score_a: 54, score_b: 44},
    {region: 'West', score_a: 46, score_b: 48},
    {region: 'East', score_a: 47, score_b: 37},
    {region: 'East', score_a: 67, score_b: 48},
    {region: 'East', score_a: 81, score_b: 71},
    {region: 'East', score_a: 86, score_b: 54},
    {region: 'East', score_a: 76, score_b: 68},
    {region: 'East', score_a: 65, score_b: 67},
    {region: 'East', score_a: 81, score_b: 50},
    {region: 'East', score_a: 59, score_b: 77},
    {region: 'East', score_a: 64, score_b: 57},
    {region: 'East', score_a: 55, score_b: 62},
    {region: 'East', score_a: 78, score_b: 47},
    {region: 'East', score_a: 77, score_b: 59},
    {region: 'East', score_a: 67, score_b: 43},
    {region: 'East', score_a: 60, score_b: 45},
    {region: 'East', score_a: 57, score_b: 81},
    {region: 'East', score_a: 86, score_b: 67},
    {region: 'South', score_a: 112, score_b: 82},
    {region: 'South', score_a: 80, score_b: 83},
    {region: 'South', score_a: 75, score_b: 85},
    {region: 'South', score_a: 93, score_b: 55},
    {region: 'South', score_a: 99, score_b: 81},
    {region: 'South', score_a: 81, score_b: 53},
    {region: 'South', score_a: 113, score_b: 86},
    {region: 'South', score_a: 98, score_b: 103},
    {region: 'South', score_a: 84, score_b: 83},
    {region: 'South', score_a: 91, score_b: 70},
    {region: 'South', score_a: 120, score_b: 67},
    {region: 'South', score_a: 75, score_b: 53},
    {region: 'South', score_a: 97, score_b: 96},
    {region: 'South', score_a: 99, score_b: 74},
    {region: 'South', score_a: 83, score_b: 73}
]

let regions_states = [
    {region: 'West', state: 'WA', score_a: 59, score_b: 51},
    {region: 'West', state: 'CA', score_a: 70, score_b: 43},
    {region: 'West', state: 'OR', score_a: 72, score_b: 38},
    {region: 'West', state: 'NV', score_a: 66, score_b: 34},
    {region: 'West', state: 'UT', score_a: 59, score_b: 48},
    {region: 'West', state: 'TX', score_a: 66, score_b: 34},
    {region: 'West', state: 'NE', score_a: 62, score_b: 30},
    {region: 'West', state: 'AK', score_a: 58, score_b: 32},
    {region: 'West', state: 'WY', score_a: 51, score_b: 35},
    {region: 'East', state: 'NY', score_a: 47, score_b: 37},
    {region: 'East', state: 'NJ', score_a: 67, score_b: 48},
    {region: 'East', state: 'DE', score_a: 81, score_b: 71},
    {region: 'East', state: 'MD', score_a: 86, score_b: 54},
    {region: 'East', state: 'CT', score_a: 76, score_b: 68},
    {region: 'East', state: 'VA', score_a: 65, score_b: 67},
    {region: 'East', state: 'WV', score_a: 81, score_b: 50},
    {region: 'East', state: 'KS', score_a: 59, score_b: 77},
    {region: 'East', state: 'IN', score_a: 64, score_b: 57},
    {region: 'East', state: 'IL', score_a: 55, score_b: 62},
    {region: 'South', state: 'NC', score_a: 112, score_b: 82},
    {region: 'South', state: 'SC', score_a: 80, score_b: 83},
    {region: 'South', state: 'GA', score_a: 75, score_b: 85},
    {region: 'South', state: 'FL', score_a: 93, score_b: 55},
    {region: 'South', state: 'TN', score_a: 99, score_b: 81},
    {region: 'South', state: 'LA', score_a: 81, score_b: 53},
    {region: 'South', state: 'AL', score_a: 113, score_b: 86},
    {region: 'South', state: 'MO', score_a: 98, score_b: 103},
    {region: 'South', state: 'MI', score_a: 84, score_b: 83},
]

let single_region = [
    {region: 'TX', score_a: 59, score_b: 51},
    {region: 'OK', score_a: 70, score_b: 43},
    {region: 'LA', score_a: 72, score_b: 38},
    {region: 'AL', score_a: 66, score_b: 34},
    {region: 'FL', score_a: 59, score_b: 48},
    {region: 'NY', score_a: 66, score_b: 34},
    {region: 'NJ', score_a: 62, score_b: 30},
    {region: 'WA', score_a: 58, score_b: 32},
    {region: 'NV', score_a: 51, score_b: 35},
    {region: 'IL', score_a: 51, score_b: 52},
    {region: 'IN', score_a: 59, score_b: 35},
    {region: 'DE', score_a: 47, score_b: 37},
    {region: 'KS', score_a: 54, score_b: 44},
    {region: 'MA', score_a: 46, score_b: 48}
]


let countries = [
    {country: 'United States', continent: 'North America', gdp_usd: 22996, gdp_growth_pct1: 0.017, interest_rate_pct1: 0.025, inflation_rate_pct1: 0.085, jobless_rate_pct1: 0.037, gov_budget: -16.7, debt_to_gdp: 137.2, current_account: -3.6, population: 332.4},
    {country: 'China', continent: 'Asia', gdp_usd: 17734, gdp_growth_pct1: 0.004, interest_rate_pct1: 0.0365, inflation_rate_pct1: 0.027, jobless_rate_pct1: 0.054, gov_budget: -3.7, debt_to_gdp: 66.8, current_account: 1.8, population: 1412.6},
    {country: 'Japan', continent: 'Asia', gdp_usd: 4937, gdp_growth_pct1: 0.002, interest_rate_pct1: -0.001, inflation_rate_pct1: 0.026, jobless_rate_pct1: 0.026, gov_budget: -12.6, debt_to_gdp: 266.2, current_account: 3.2, population: 125.31},
    {country: 'Germany', continent: 'Europe', gdp_usd: 4223, gdp_growth_pct1: 0.017, interest_rate_pct1: 0.005, inflation_rate_pct1: 0.079, jobless_rate_pct1: 0.055, gov_budget: -3.7, debt_to_gdp: 69.3, current_account: 7.4, population: 83.16},
    {country: 'United Kingdom', continent: 'Europe', gdp_usd: 3187, gdp_growth_pct1: 0.029, interest_rate_pct1: 0.0175, inflation_rate_pct1: 0.101, jobless_rate_pct1: 0.038, gov_budget: -6, debt_to_gdp: 95.9, current_account: -2.6, population: 67.53},
    {country: 'India', continent: 'Asia', gdp_usd: 3173, gdp_growth_pct1: 0.135, interest_rate_pct1: 0.054, inflation_rate_pct1: 0.0671, jobless_rate_pct1: 0.078, gov_budget: -9.4, debt_to_gdp: 73.95, current_account: -1.7, population: 1380},
    {country: 'France', continent: 'Europe', gdp_usd: 2937, gdp_growth_pct1: 0.042, interest_rate_pct1: 0.005, inflation_rate_pct1: 0.058, jobless_rate_pct1: 0.074, gov_budget: -6.5, debt_to_gdp: 112.9, current_account: 0.4, population: 67.63},
    {country: 'Italy', continent: 'Europe', gdp_usd: 2100, gdp_growth_pct1: 0.047, interest_rate_pct1: 0.005, inflation_rate_pct1: 0.084, jobless_rate_pct1: 0.079, gov_budget: -7.2, debt_to_gdp: 150.8, current_account: 2.5, population: 59.24},
    {country: 'Canada', continent: 'North America', gdp_usd: 1991, gdp_growth_pct1: 0.029, interest_rate_pct1: 0.025, inflation_rate_pct1: 0.076, jobless_rate_pct1: 0.049, gov_budget: -4.7, debt_to_gdp: 117.8, current_account: 0.1, population: 38.44},
    {country: 'South Korea', continent: 'Asia', gdp_usd: 1799, gdp_growth_pct1: 0.029, interest_rate_pct1: 0.025, inflation_rate_pct1: 0.057, jobless_rate_pct1: 0.029, gov_budget: -6.1, debt_to_gdp: 42.6, current_account: 3.5, population: 51.74},
    {country: 'Russia', continent: 'Europe', gdp_usd: 1776, gdp_growth_pct1: -0.04, interest_rate_pct1: 0.08, inflation_rate_pct1: 0.151, jobless_rate_pct1: 0.039, gov_budget: 0.8, debt_to_gdp: 18.2, current_account: 6.8, population: 145.55},
    {country: 'Brazil', continent: 'South America', gdp_usd: 1609, gdp_growth_pct1: 0.032, interest_rate_pct1: 0.1375, inflation_rate_pct1: 0.1007, jobless_rate_pct1: 0.091, gov_budget: -4.5, debt_to_gdp: 80.27, current_account: -1.8, population: 213.32}
]
</script>

## Scatter Plot

<ScatterPlot
data={countries}
x=gdp_usd
y=gdp_growth_pct1
tooltipTitle=country
>

    <ReferenceLine y=0.065/>

</ScatterPlot>

## Multi-Series Scatter Plot

<ScatterPlot
data={countries}
x=gdp_usd
y=gdp_growth_pct1
tooltipTitle=country
series=continent
>

    <ReferenceLine y=0.065/>

</ScatterPlot>

## Multi-Series Scatter Plot with Custom Height

<ScatterPlot
    data={countries}
    x=gdp_usd
    y=gdp_growth_pct1
    tooltipTitle=country
    series=continent
    chartAreaHeight=380
/>
