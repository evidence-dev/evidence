import getColumnType from "./getColumnType.js";
import getColumnExtents from "./getColumnExtents.js";
import getColumnUnits from "./getColumnUnits.js";
import getColumnFormat from "./getColumnFormat.js";
import formatTitle from './formatTitle.js'
import getFormatTag from "./getFormatTag.js";

export default function getColumnSummary(data, returnType="object") {

    var colName;
    var colFmtTag;        
    var colType;
    var colExtents;
    var colUnits;
    var colFormat;

    let columnSummary = [];

    if(returnType === 'object'){
      for (const [key] of Object.entries(data[0])) {
        colName = key;
        colFmtTag = getFormatTag(key);
        colType = getColumnType(data, colName, colFmtTag);
        colExtents = getColumnExtents(data, colName);        
        colUnits = getColumnUnits(colExtents);
        colFormat = getColumnFormat(colFmtTag, colType);
  
        let thisCol = {
            [colName]: {
                title: formatTitle(colName, colFormat),
                type: colType,
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
        colType = getColumnType(data, colName, colFmtTag);
        colExtents = getColumnExtents(data, colName);        
        colUnits = getColumnUnits(colExtents);
        colFormat = getColumnFormat(colFmtTag, colType);
  
          columnSummary.push({
              id: colName,
              title: formatTitle(colName, colFormat),
              type: colType,
              extents: colExtents,
              format: colFormat,
              units: colUnits
          })
      }
    }

      return columnSummary
}