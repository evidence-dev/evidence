import type * as maplibregl from 'maplibre-gl';
import { loadMapGL } from './map-gl';
import { formatValue } from '../../formatValue';
import formatTitle from '../../formatTitle';
import { escapeHtml } from '../../common/tooltip-fields';

export interface TooltipField {
	label: string;
	value: string | number | boolean | null | undefined;
	format?: string;
}

export interface TooltipContent {
	title?: string;
	subtitle?: string;
	valueFields: TooltipField[];
}

/**
 * Creates a GL popup with consistent configuration for map tooltips
 */
export async function createMapTooltip(): Promise<maplibregl.Popup> {
	const gl = await loadMapGL();
	return new gl.Popup({
		closeButton: false,
		closeOnClick: false,
		className: 'map-tooltip',
		offset: 15,
		maxWidth: '300px'
	});
}

/**
 * Builds HTML content for map tooltips with consistent styling
 */
export function buildTooltipHTML(content: TooltipContent): string {
	const { title, subtitle, valueFields } = content;

	// If nothing to show, return empty
	if (!title && !subtitle && valueFields.length === 0) {
		return '';
	}

	let html = '<div>';

	// Title (bold, larger)
	if (title) {
		html += `<div class="font-semibold text-sm">${escapeHtml(title)}</div>`;
	}

	// Subtitle (muted, smaller)
	if (subtitle) {
		const marginClass = valueFields.length > 0 ? ' mb-1' : '';
		html += `<div class="text-xs opacity-70${marginClass}">${escapeHtml(subtitle)}</div>`;
	}

	// Value fields (key-value pairs)
	for (const field of valueFields) {
		if (field.value === undefined || field.value === null) {
			continue;
		}

		const formattedValue = formatValue(field.value, field.format ?? 'num', String(field.value));
		const label = field.label;

		html += `
			<div class="flex items-center justify-between gap-3">
				<span class="text-xs opacity-80">${escapeHtml(label)}</span>
				<span class="text-xs font-medium">${escapeHtml(formattedValue)}</span>
			</div>
		`;
	}

	html += '</div>';
	return html;
}

/**
 * Formats a column name into a human-readable label
 */
export function formatFieldLabel(columnName: string): string {
	return formatTitle(columnName);
}
