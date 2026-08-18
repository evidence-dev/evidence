import { containsVariableSyntax, type Validator } from './types';

export const validateVizOptions = (): Validator => (node) => {
	const viz = node.attributes.viz;
	const sparklineOptions = node.attributes.sparkline_options;
	const deltaOptions = node.attributes.delta_options;
	const barOptions = node.attributes.bar_options;
	const colorOptions = node.attributes.color_options;

	const errors: ReturnType<Validator> = [];

	// Skip validation if viz contains variable syntax - value unknown until runtime
	if (containsVariableSyntax(viz)) {
		return errors;
	}

	// Check sparkline_options requires viz="sparkline"
	if (sparklineOptions && viz !== 'sparkline') {
		errors.push({
			id: 'sparkline-options-without-viz',
			level: 'error' as const,
			message: 'sparkline_options can only be used when viz="sparkline"',
			location: node.location
		});
	}

	// Check delta_options requires viz="delta"
	if (deltaOptions && viz !== 'delta') {
		errors.push({
			id: 'delta-options-without-viz',
			level: 'error' as const,
			message: 'delta_options can only be used when viz="delta"',
			location: node.location
		});
	}

	// Check bar_options requires viz="bar"
	if (barOptions && viz !== 'bar') {
		errors.push({
			id: 'bar-options-without-viz',
			level: 'error' as const,
			message: 'bar_options can only be used when viz="bar"',
			location: node.location
		});
	}

	// Check color_options requires viz="color"
	if (colorOptions && viz !== 'color') {
		errors.push({
			id: 'color-options-without-viz',
			level: 'error' as const,
			message: 'color_options can only be used when viz="color"',
			location: node.location
		});
	}

	return errors;
};
