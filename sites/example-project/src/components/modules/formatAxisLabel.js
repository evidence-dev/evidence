import { applyFormatting, getAxisFormatCode } from '$lib/modules/formats';

export default function formatAxisLabel(value, columnFormat, columnUnits) {

    let suffix;
    switch(columnUnits){
          case "B":
              value = value / 1000000000; // 1,000,000,000
              suffix = columnUnits;
              break;
          case "M":
              value = value / 1000000; // 1,000,000
              suffix = columnUnits;
              break;
          case "k":
              value = value / 1000; // 1,000
              suffix = columnUnits;
              break;
          default:
              value = value;
              suffix = '';
    }

    let fmt = getAxisFormatCode(columnFormat);
    if (fmt) {
        try {
            let formattedValue = applyFormatting(value, fmt);
            if (formattedValue) {
                return formattedValue + suffix;
            }
        } catch (error) {
            //fallback to default
        }
    }
    return value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + suffix;
}
