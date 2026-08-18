export {
	extractDataReferences,
	extractInlineQueryDefinitions,
	extractPartialReferences,
	extractSqlTableReferences,
	type DataReference,
	type InlineQueryDefinition,
	type PartialReference,
	type SqlTableReference
} from './extract';

export {
	resolveReference,
	resolveAllReferences,
	type ResolvedReference,
	type ReferenceStatus,
	type ResolutionContext
} from './resolve';

export { type LineageReference, type LineageSourceKind } from './types';
