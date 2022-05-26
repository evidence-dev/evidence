const pg = require("pg");

//ts enum
var EvidenceType;
(function (EvidenceType) {
    EvidenceType["BOOLEAN"] = "boolean";
    EvidenceType["NUMBER"] = "number";
    EvidenceType["STRING"] = "string";
    EvidenceType["DATE"] = "date";
})(EvidenceType || (EvidenceType = {}));
/**
 * Some types that are not defined in the PG library
 */
const pgBuiltInTypeExtentions = {
    'CHAR': 18,
    'JSON': 114,
    'JSONB': 3802,
    'XML': 142,
    'UUID': 2950,
    'NAME': 19,
    'JSONPATH': 4072,
    //arrays of type
    '_XML': 143,
    '_JSON': 199,
    '_MONEY': 791,
    '_BOOL': 1000,
    '_CHAR': 1002
};
const pgTypeToEvidenceType = function (dataTypeId, defaultType = undefined) {
    switch (dataTypeId) {
        case pg.types.builtins.BOOL:
            return EvidenceType.BOOLEAN;
        case pg.types.builtins.NUMERIC:
        case pg.types.builtins.MONEY:
        case pg.types.builtins.INT2:
        case pg.types.builtins.INT4:
        case pg.types.builtins.INT8:
        case pg.types.builtins.FLOAT4:
        case pg.types.builtins.FLOAT8:
            return EvidenceType.NUMBER;
        case pg.types.builtins.VARCHAR:
        case pg.types.builtins.TEXT:
        case pg.types.builtins.STRING:
        case pgBuiltInTypeExtentions.CHAR:
        case pgBuiltInTypeExtentions.JSON:
        case pgBuiltInTypeExtentions.XML:
        case pgBuiltInTypeExtentions.NAME:
            return EvidenceType.STRING;
        case pg.types.builtins.DATE:
        case pg.types.builtins.TIME:
        case pg.types.builtins.TIMETZ:
        case pg.types.builtins.TIMESTAMP:
        case pg.types.builtins.TIMESTAMPTZ:
            return EvidenceType.DATE;
        default:
            return defaultType;
    }
};
const nativeToEvidenceType = function (results) {
    return results.fields.map(field => {
        return ({ 'name': field.name, 'evidenceType': (0, exports.nativeTypeToEvidenceType)(field.dataTypeID, EvidenceType.STRING) });
    });
};
export { nativeToEvidenceType, EvidenceType };
