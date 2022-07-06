import { applyFormatting, AXIS_FORMATTING_CONTEXT } from '$lib/modules/formats';

export default function formatAxisLabel(value, columnFormat, columnUnits) {

    try {
        let formattedValue = applyFormatting(value, columnFormat, AXIS_FORMATTING_CONTEXT, columnUnits);
        if (formattedValue) {
            return formattedValue;
        }
    } catch (error) {
        //fallback to default
    }

    return value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
}
