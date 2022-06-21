import { applyFormatting } from "$lib/modules/formats";

export default function (value, columnFormat, columnUnits) {
  if (value === undefined) {
    return "-";
  } else {
    let suffix;
    switch (columnUnits) {
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
        suffix = "";
    }

    // Get format tag from end of column name (if supplied):
    let fmt = columnFormat;
    try {
      return applyFormatting(value, fmt) + suffix; //TODO issue-333 we need to consolidate columnUnits and columnFormat
    } catch (error) {
      if (typeof value === "number") {
        return (
          value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) + suffix
        );
      } else {
        return value;
      }
    }
  }
}
