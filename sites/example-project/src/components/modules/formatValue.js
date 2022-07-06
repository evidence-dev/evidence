import { applyFormatting, VALUE_FORMATTING_CONTEXT } from "$lib/modules/formats";

export default function (value, columnFormat, columnUnits) {

  if (value === undefined) {
    return "-";
  } else {
    if (columnFormat) {
      try {
        return applyFormatting(value, columnFormat, VALUE_FORMATTING_CONTEXT, columnUnits);
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
        })
      );
    } else {
      return value;
    }
  }

}
