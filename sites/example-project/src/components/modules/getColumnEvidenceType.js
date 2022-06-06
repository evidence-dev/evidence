export default function getColumnEvidenceType(data, column) {
  let item;
  if (data) {
    if (Array.isArray(data) && data.length > 0) {
      item = data[0];
    } else {
      item = data;
    }
    if (item && item['_evidenceColumnTypes']) {
      let columnTypes = item['_evidenceColumnTypes'];
      return columnTypes.find(item => item.name === column);
    }
  }

  return null;  
}
