export const validMinimalConfig = `
components: {}
`;
export const validMinimalConfigParsed = {
	components: {}
};

export const handleAt = `
components:
    "@evidence-dev/ui": {}
    @evidence-dev/ui-d3: {}
`;
export const handleAtParsed = {
	components: {
		'@evidence-dev/ui': {},
		'@evidence-dev/ui-d3': {}
	}
};

export const validConfig = `
components:
    # No Configuration
    "@evidence-dev/ui": {}
    # Configurations
    @evidence-dev/ui-d3:
        # Override other LineCharts with own LineChart
        # TODO: How does this interact with aliases?
        overrides:
            LineChart: LineChart
            Text: AliasedText
        aliases:
            BarChart: D3BarChart
            Text: AliasedText
`;
export const validConfigParsed = {
	components: {
		'@evidence-dev/ui': {},
		'@evidence-dev/ui-d3': {
			overrides: {
				LineChart: 'LineChart',
				Text: 'AliasedText'
			},
			aliases: {
				BarChart: 'D3BarChart',
				Text: 'AliasedText'
			}
		}
	}
};

export const invalidMinimalConfig = `
components: []
`;
