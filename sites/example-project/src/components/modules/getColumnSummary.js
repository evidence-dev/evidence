import getColumnEvidenceType from "./getColumnEvidenceType.js";
import getColumnExtents from "./getColumnExtents.js";
import getColumnUnits from "./getColumnUnits.js";
import { getColumnFormat } from "./formats";
import formatTitle from './formatTitle.js'
import getFormatTag from "./getFormatTag.js";

export default function getColumnSummary(data, returnType="object") {

    var colName;
    var colFmtTag;        
    var colType;
    var evidenceColumnType;
    var colExtents;
    var colUnits;
    var colFormat;
    var legacyType; 

    let columnSummary = [];

    if(returnType === 'object'){
      for (const [key] of Object.entries(data[0])) {
        colName = key;
        colFmtTag = getFormatTag(key);
        evidenceColumnType = getColumnEvidenceType(data, colName);
        colType = evidenceColumnType.evidenceType
        colExtents = getColumnExtents(data, colName);        
        colUnits = getColumnUnits(colExtents);
        colFormat = getColumnFormat(colFmtTag);
  
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
        colFmtTag = getFormatTag(key);
        evidenceColumnType = getColumnEvidenceType(data, colName);
        colType = evidenceColumnType.evidenceType
        colExtents = getColumnExtents(data, colName);        
        colUnits = getColumnUnits(colExtents);
        colFormat = getColumnFormat(colFmtTag);
  
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