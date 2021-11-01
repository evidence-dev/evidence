import getColumnType from "../modules/getColumnType.js";
import getColumnExtents from "../modules/getColumnExtents.js";
import getColumnUnits from "../modules/getColumnUnits.js";
import getColumnFormat from "../modules/getColumnFormat.js";
import formatTitle from '../modules/formatTitle.js'
import getFormatTag from "../modules/getFormatTag.js";

export default function getColumnSummary(data) {

    var colName;
    var colFmtTag;        
    var colType;
    var colExtents;
    var colUnits;
    var colFormat;

    let columnSummary = [];

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

      return columnSummary
}