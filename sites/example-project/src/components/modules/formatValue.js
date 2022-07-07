import { formatValue } from "$lib/modules/formatting";

export default function (value, columnFormat, columnUnits) {
  return formatValue(value, columnFormat, columnUnits);
}
