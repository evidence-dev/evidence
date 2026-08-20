import type { Config, Node } from '@markdoc/markdoc';
import type { Validator } from './types';

/** Only runs the given `validator` if `condition` returns true */
export const ifCondition =
	(
		condition: (node: Node, config: Config, context?: unknown) => boolean,
		validator: Validator
	): Validator =>
	(node, config, context) => {
		if (!condition(node, config, context)) return [];
		return validator(node, config, context);
	};
