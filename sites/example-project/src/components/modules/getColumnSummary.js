import getColumnEvidenceType from "./getColumnEvidenceType.js";
import { getColumnExtentsLegacy } from "./getColumnExtents.js";
import getColumnUnits from "./getColumnUnits.js";
import { lookupColumnFormat } from "./formatting";
import formatTitle from './formatTitle.js'

export default function getColumnSummary(data, returnType="object") {

    var colName;
    var colType;
    var evidenceColumnType;
    var colExtents;
    var colUnits;
    var colFormat;

    let columnSummary = [];

    if(returnType === 'object'){
      for (const [key] of Object.entries(data[0])) {
        colName = key;
        evidenceColumnType = getColumnEvidenceType(data, colName);
        colType = evidenceColumnType.evidenceType;
        colExtents = getColumnExtentsLegacy(data, colName);
        colUnits = getColumnUnits(colExtents);
        colFormat = lookupColumnFormat(key, evidenceColumnType);
        let thisCol = {
            [colName]: {
                title: formatTitle(colName, colFormat),
                type: colType,
                evidenceColumnType: evidenceColumnType,
                extents: colExtents,
                format: colFormat,
                units: colUnits
              }
        }
        columnSummary = {...columnSummary, ...thisCol}
      }
    } else {
      for (const [key] of Object.entries(data[0])) {
        colName = key;
        evidenceColumnType = getColumnEvidenceType(data, colName);
        colType = evidenceColumnType.evidenceType;
        colExtents = getColumnExtentsLegacy(data, colName);
        colUnits = getColumnUnits(colExtents);
        colFormat = lookupColumnFormat(key, evidenceColumnType);
          columnSummary.push({
              id: colName,
              title: formatTitle(colName, colFormat),
              type: colType,
              evidenceColumnType: evidenceColumnType,
              extents: colExtents,
              format: colFormat,
              units: colUnits
          })
      }
    }

    return columnSummary
}