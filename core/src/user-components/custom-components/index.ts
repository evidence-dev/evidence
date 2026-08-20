export {
	parseCustomComponentAttributes,
	parseCustomComponentAttributesWithErrors,
	customComponentAttributesSchema,
	CUSTOM_COMPONENT_ATTRIBUTE_TYPES,
	ATTRIBUTE_TYPES
} from './component-attribute-schema';
export type {
	CustomComponentAttributeType,
	CustomComponentAttributeDeclaration
} from './component-attribute-schema';
export type { AttributeTypeDef } from './attribute-types';
export {
	detectMisnestedAttributeDeclarations,
	type MisnestedAttribute
} from './detect-misnested-attributes';
export {
	namespaceComponentQueries,
	namespacePrefix,
	collectLocalQueryNames,
	buildQueryRenameMap,
	rewriteEvidenceQueryCalls
} from './namespace-component-queries';
export { findSelfReferences } from './detect-self-reference';
export { declaredCallerVariablesFromContent } from './declared-caller-variables';
export {
	buildCustomComponentRegistry,
	buildCustomComponentTag,
	parseCustomComponentMeta,
	tagNameForComponentPath,
	customComponentsAsUserComponents,
	replaceSlotPlaceholders,
	dissolveRemainingSlotPlaceholders,
	type CustomComponentMeta
} from './build-custom-tags';
