import { applyFormatting, getFormatCode } from "$lib/modules/formats";

export default function (value, columnFormat, columnUnits) {

  let fmt = getFormatCode(columnFormat);

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


    if (fmt) {
      try {
        let formattedValue = applyFormatting(value, fmt);
        if (formattedValue) {
          return formattedValue + suffix
        }
      } catch (error) {
        //fallback to default
      }
    }

    //fallback if no formatting could be applied
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
