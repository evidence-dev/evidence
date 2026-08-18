import type { MarkLineComponentOption, SeriesOption } from 'echarts';
import type { ReferenceLineStaticProps } from './types';
import { userTheme } from '../../../../../user-theme.svelte';
import chroma from 'chroma-js';
import type { XAxisModel } from '../../XAxisModel.svelte';
import type { YAxisModel } from '../../YAxisModel.svelte';
import { formatValue } from '../../../../../formatValue';

export class ReferenceLineStaticModel {
	readonly props: ReferenceLineStaticProps;

	get axis(): XAxisModel | YAxisModel | undefined {
		if (typeof this.props.x !== 'undefined') return this.xAxis;
		if (typeof this.props.y !== 'undefined') return this.yAxis;
		return undefined;
	}

	get series(): SeriesOption {
		let data: NonNullable<MarkLineComponentOption['data']>[number][];

		if (typeof this.props.x !== 'undefined') {
			data = [
				{
					xAxis: this.props.x,
					symbol: this.props.symbols.start.shape,
					symbolSize: this.props.symbols.start.size
				}
			];
		} else if (typeof this.props.y !== 'undefined') {
			data = [
				{
					yAxis: this.props.y,
					symbol: this.props.symbols.start.shape,
					symbolSize: this.props.symbols.start.size
				}
			];
		} else if (
			typeof this.props.x1 !== 'undefined' &&
			typeof this.props.y1 !== 'undefined' &&
			typeof this.props.x2 !== 'undefined' &&
			typeof this.props.y2 !== 'undefined'
		) {
			data = [
				[
					{
						coord: [this.props.x1, this.props.y1],
						symbol: this.props.symbols.start.shape,
						symbolSize: this.props.symbols.start.size
					},
					{ coord: [this.props.x2, this.props.y2] }
				]
			];
		} else {
			data = [];
		}

		let label: string = '';
		const hideValue = this.props.label_options.hide_value;
		const rawValue = this.props.x ?? this.props.y; // only show value for x or y line, not sloped line
		// TODO this format would be more accurate if it considered the data's range
		const value = formatValue(
			rawValue,
			this.props.label_options.fmt ?? this.axis?.options.fmt,
			rawValue?.toString()
		);

		if (!value || hideValue) {
			label = this.props.label ?? '';
		} else if (this.props.label) {
			label = `${this.props.label} (${value})`;
		} else {
			label = value.toString();
		}

		return {
			type: 'line',
			animation: false,
			markLine: {
				data,
				animation: false,
				emphasis: {
					disabled: true
				},
				label: {
					show: Boolean(label),
					position: this.props.label_options.position ?? 'insideEndTop',
					align: this.props.label_options.align,
					color:
						this.props.label_options.color ??
						this.props.color ??
						userTheme.current['muted-foreground'],
					backgroundColor:
						this.props.label_options.background_color ??
						chroma(userTheme.current['background']).alpha(0.8).css(),
					padding: this.props.label_options.padding,
					fontSize: this.props.label_options.text.size,
					fontStyle: this.props.label_options.text.italic ? 'italic' : 'normal',
					fontWeight: this.props.label_options.text.bold ? 'bold' : 'normal',
					borderWidth: this.props.label_options.border.width,
					borderType: this.props.label_options.border.type,
					borderColor: this.props.label_options.border.color ?? userTheme.current['border'],
					borderRadius: this.props.label_options.border.radius,
					formatter: () => label
				},
				lineStyle: {
					color:
						this.props.line_options.color ??
						this.props.color ??
						userTheme.current['muted-foreground'],
					width: this.props.line_options.width,
					type: this.props.line_options.type,
					opacity: this.props.line_options.opacity
				},
				symbol: this.props.symbols.end.shape,
				symbolSize: this.props.symbols.end.size
			}
		};
	}

	constructor(
		readonly propsGetter: () => ReferenceLineStaticProps,
		readonly xAxis: XAxisModel,
		readonly yAxis: YAxisModel
	) {
		this.props = $derived(this.propsGetter());
	}
}
