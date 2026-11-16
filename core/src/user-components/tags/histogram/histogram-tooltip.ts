import type { Translate } from '../../../locale/messages';
import { escapeHtml } from '../../common/tooltip-fields';

export function histogramTooltipHtml(
	t: Translate,
	{ seriesRow, range, frequency }: { seriesRow: string; range: string; frequency: string }
): string {
	return `
					<div style="display:flex;flex-direction:column;">
						${seriesRow}
						<div style="display:grid;grid-template-columns:auto auto;gap:4px 12px;">
							<span>${escapeHtml(t('histogram.range'))}</span>
							<span style="text-align:right;font-weight:500;">${escapeHtml(range)}</span>
							<span>${escapeHtml(t('histogram.count'))}</span>
							<span style="text-align:right;font-weight:500;">${frequency}</span>
						</div>
					</div>
				`;
}
