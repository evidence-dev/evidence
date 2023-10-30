export * from '@evidence-dev/query-store';
export * from '@evidence-dev/query-store/dist/types.js';

import { QueryStore } from '@evidence-dev/query-store/dist';
import { QueryResult } from '@evidence-dev/query-store/dist/types.js';

// JSDoc makes the definition in query-store any for some reason
export type QueryStoreValue = QueryStore & QueryResult[];

export type Format = {
	formatCode: string;
	valueType: EvidenceTypeDescriptor['evidenceType'];
	exampleInput: EvidenceTypeUnion;
	_autoFormat: {
		autoFormatFunction?: <T extends EvidenceTypeUnion>(
			value: T,
			format?: Format,
			columnUnitSummary?: ColumnUnitSummary
		) => T | string;
		autoFormatCode?: string;
		truncateUnits?: boolean;
		columnUnits?: ColumnUnits;
	};
};

export type FormatDescription = {
	name: string;
	description: string;
	matchingFunction: (
		columnName: string,
		evidenceTypeDescriptor: EvidenceTypeDescriptor,
		columnUnitSummary: ColumnUnitSummary | undefined
	) => boolean;
	format: Format;
};

export type ColumnUnitSummary = ReturnType<
	typeof import('./getColumnExtents.js').getColumnUnitSummary
>;

export type ColumnSummary = {
	title: string;
	type: string;
	evidenceColumnType: EvidenceTypeDescriptor;
	format: Format;
	columnUnitSummary: ColumnUnitSummary;
};

export type ColumnUnits = 'T' | 'B' | 'M' | 'k' | '';
