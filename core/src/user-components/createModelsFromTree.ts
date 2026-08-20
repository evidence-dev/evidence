import type { RenderableTreeNode, ValidateError } from '@markdoc/markdoc';
import type { UserComponentModel } from './UserComponentModel';
import { walkTree } from './Renderer/MarkdocProcessor/walkTree';
import Markdoc from '@markdoc/markdoc';
import { getUserComponent, isUserComponent } from '..';
import type { QueryDependencies } from '../Query.svelte';
import type { MetricsCatalog } from '../metrics/metrics-catalog';
import { doesValidateErrorApplyToTag } from './Renderer/MarkdocProcessor/doesValidateErrorApplyToNode';
import { logger } from '../shims/logger';

export type ModelsByTagId = { [tagId: string]: UserComponentModel };

export const createModelsFromTree = (
	tree: RenderableTreeNode,
	allValidationErrors: ValidateError[],
	deps: QueryDependencies,
	serializedModels?: { [tagId: string]: unknown },
	metricsCatalog?: MetricsCatalog
): ModelsByTagId => {
	const modelsByTagId: ModelsByTagId = {};

	for (const { node, parent } of walkTree(tree)) {
		try {
			if (!Markdoc.Tag.isTag(node)) continue;
			if (!isUserComponent(node.name)) continue;
			const { Model } = getUserComponent(node.name);
			if (!Model) continue;

			const parentModel = parent ? modelsByTagId[parent.id] : null;
			const model = new Model({
				attributes: node.attributes,
				validationErrors: allValidationErrors.filter((e) => doesValidateErrorApplyToTag(node, e)),
				parent: parentModel,
				deps,
				metricsCatalog,
				serialized: serializedModels?.[node.id]
			});

			parentModel?.addChild(model);
			modelsByTagId[node.id] = model;
		} catch (e) {
			logger.error(e, 'Failed to create model from tree node');
		}
	}

	return modelsByTagId;
};
