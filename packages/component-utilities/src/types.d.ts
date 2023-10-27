export type EvidenceTypeDescriptor = {
	name: string;
	evidenceType: EvidenceType;
	typeFidelity: TypeFidelity;
};

export type EvidenceQueryResults = Record<string, EvidenceTypeUnion>[] & {
	0: EvidenceTypeUnion & {
		error_object: {
			error: Error;
		};
	};
};

export type EvidenceTypeUnion = boolean | number | string | Date;

export type EvidenceType = 'boolean' | 'number' | 'string' | 'date';

export type TypeFidelity = 'precise' | 'inferred';

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
