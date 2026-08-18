import type { RenderableTreeNode } from '@markdoc/markdoc';
import Markdoc from '@markdoc/markdoc';
import { getUserComponent, isUserComponent } from '../..';
import { hasComponentWrapper } from '../types';

type FlexConfig = { grow: number; minWidth: number; minHeight?: number };

export const getFlexConfig = (node: RenderableTreeNode): FlexConfig | undefined => {
	if (!Markdoc.Tag.isTag(node) || !isUserComponent(node.name)) {
		return;
	}

	const { schema } = getUserComponent(node.name);
	if (
		!hasComponentWrapper(schema) ||
		!('flex' in schema.componentWrapper) ||
		!schema.componentWrapper.flex
	) {
		return;
	}
	const { grow, minWidth, minHeight } = schema.componentWrapper.flex;

	// TODO there may be some edge cases to handle here to ensure sensible layouts when, for example, a row is nested within a row (or other complex nestings)
	const childMaxes = node.children.reduce<FlexConfig>(
		(max, child) => {
			const childConfig = getFlexConfig(child);
			if (!childConfig) return max;

			const maxGrow = Math.max(max.grow, childConfig.grow);
			const maxMinWidth = Math.max(max.minWidth, childConfig.minWidth);

			let maxMinHeight: number | undefined;
			if (typeof max.minHeight === 'undefined') {
				if (typeof childConfig.minHeight === 'undefined') {
					maxMinHeight = undefined;
				} else {
					maxMinHeight = childConfig.minHeight;
				}
			} else {
				if (typeof childConfig.minHeight === 'undefined') {
					maxMinHeight = max.minHeight;
				} else {
					maxMinHeight = Math.max(max.minHeight, childConfig.minHeight);
				}
			}

			return {
				grow: maxGrow,
				minWidth: maxMinWidth,
				minHeight: maxMinHeight
			};
		},
		{
			grow: 0,
			minWidth: 0,
			minHeight: undefined
		}
	);

	return {
		grow: grow === 'children' ? childMaxes.grow : grow,
		minWidth: minWidth === 'children' ? childMaxes.minWidth : minWidth,
		minHeight: minHeight === 'children' ? childMaxes.minHeight : minHeight
	};
};
