export const defaultConfig = {
	'@evidence-dev/core-components': {
		overrides: [],
		aliases: {},
		provides: []
	}
};

export const validMinimalConfig = `
components: {}
`;
export const validMinimalConfigParsed = {
	components: {},
	databases: {}
};

export const handleAt = `
components:
    "@evidence-dev/core-components": {}
    @evidence-dev/core-components-d3: {}
`;
export const handleAtParsed = {
	components: {
		'@evidence-dev/core-components': {
			overrides: [],
			aliases: {},
			provides: []
		},
		'@evidence-dev/core-components-d3': {
			overrides: [],
			aliases: {},
			provides: []
		}
	},
	databases: {}
};

export const validConfig = `
components:
    # No Configuration
    "@evidence-dev/core-components": {}
    # Configurations
    @evidence-dev/core-components-d3:
        # Override other LineCharts with own LineChart
        overrides:
            - LineChart
            - AliasedText
        aliases:
            D3BarChart: BarChart
            AliasedText: Text
`;
export const validConfigParsed = {
	components: {
		'@evidence-dev/core-components': {
			overrides: [],
			aliases: {},
			provides: []
		},
		'@evidence-dev/core-components-d3': {
			overrides: ['LineChart', 'AliasedText'],
			aliases: {
				D3BarChart: 'BarChart',
				AliasedText: 'Text'
			},
			provides: []
		}
	},
	databases: {}
};

export const invalidMinimalConfig = `
components: []
`;
