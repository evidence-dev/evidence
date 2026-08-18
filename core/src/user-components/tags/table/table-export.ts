import {
	downloadAsExcel,
	getExcelExportNames,
	type CellStyle,
	type GetCellStyleArgs
} from '../../../shims/data-export';
import type { ColumnMetaItem, PivotResult } from '../../common/pivot-utils';

interface BuildExportHandlerParams {
	sortedPivotData: PivotResult;
	filename?: string;
	title?: string;
	subtitle?: string;
}

function resolveEffectiveFmt(meta: ColumnMetaItem): string | undefined {
	if (!meta.comparison) return meta.fmt;
	const displayType = meta.comparison.display_type ?? 'pct';
	if (displayType === 'pct') return meta.comparison.pct_fmt || 'pct';
	if (displayType === 'compared_value') return meta.fmt;
	return meta.comparison.abs_fmt || meta.fmt || 'num0';
}

export function buildTableExcelExportColumns(sortedPivotData: PivotResult) {
	const { headerLevels, columns } = sortedPivotData;

	return sortedPivotData.columnMeta
		.filter((meta) => !meta.hide && meta.viz !== 'sparkline')
		.map((meta) => {
			const columnIndex = columns.indexOf(meta.key);
			// Flatten the on-screen multi-row header into ONE label per column: walk every
			// header level and collect the pivot value(s) + measure covering this column
			// (e.g. "Dressings - Avocado - ACV Wtd Dist"). With multiple measures the leaf
			// row is the measure name and the pivot path lives in the levels above it, so
			// taking only the leaf dropped the pivot context and repeated the measure title
			// on every column (multi-pivot/multi-measure case).
			const parts: string[] = [];
			for (const level of headerLevels) {
				const cell = level.find(
					(c) => columnIndex >= c.startIndex && columnIndex < c.startIndex + (c.colspan ?? 1)
				);
				if (!cell || cell.isDimension) continue;
				const label = cell.headerType === 'measure' ? cell.title || cell.label : cell.label;
				if (label && label !== parts[parts.length - 1]) parts.push(label);
			}

			return {
				name: meta.key,
				jsType: meta.type,
				title: parts.length ? parts.join(' - ') : meta.title,
				fmt: resolveEffectiveFmt(meta)
			};
		});
}

export function buildTableExcelExportHandler({
	sortedPivotData,
	filename = 'table_data',
	title,
	subtitle
}: BuildExportHandlerParams): () => Promise<void> {
	return async () => {
		// Sparkline columns render as mini-charts on-screen and have no useful flat
		// representation — strip them from the export entirely.
		const visibleColumnMeta = sortedPivotData.columnMeta.filter(
			(meta) => !meta.hide && meta.viz !== 'sparkline'
		);

		const columnsWithTitles = buildTableExcelExportColumns(sortedPivotData);

		const getCellStyle = ({ row, columnIndex }: GetCellStyleArgs): CellStyle | undefined => {
			const meta = visibleColumnMeta[columnIndex];
			const renderType = row.render_type;

			if (renderType === 'row_total') {
				return { font: { bold: true }, border: { top: { style: 'thin' } } };
			}
			if (renderType === 'row_subtotal') {
				const subtotalLevel = typeof row.subtotal_level === 'number' ? row.subtotal_level : 1;
				if (columnIndex >= subtotalLevel - 1) {
					return { font: { bold: true }, border: { top: { style: 'thin' } } };
				}
			}
			if (meta?.render_type === 'column_total' || meta?.render_type === 'column_subtotal') {
				return { font: { bold: true } };
			}
			return undefined;
		};

		const exportNames = getExcelExportNames({
			title,
			fallbackFilename: filename
		});

		await downloadAsExcel({
			...exportNames,
			data: sortedPivotData.rows,
			columns: columnsWithTitles,
			getCellStyle,
			metadata: { title, subtitle }
		});
	};
}
