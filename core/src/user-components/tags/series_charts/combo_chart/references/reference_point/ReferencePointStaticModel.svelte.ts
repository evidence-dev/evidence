import type { SeriesOption } from 'echarts';
import type { ReferencePointStaticProps } from './types';
import { userTheme } from '../../../../../user-theme.svelte';
import chroma from 'chroma-js';
import type { XAxisModel } from '../../XAxisModel.svelte';
import type { YAxisModel } from '../../YAxisModel.svelte';
import { formatValue } from '../../../../../formatValue';

export class ReferencePointStaticModel {
	readonly props: ReferencePointStaticProps;

	get axis(): XAxisModel | YAxisModel | undefined {
		if (this.props.labelAxis === 'x') return this.xAxis;
		if (this.props.labelAxis === 'y') return this.yAxis;
		return undefined;
	}

	get series(): SeriesOption {
		const defaultLabelBackgroundColor =
			this.props.label_options.variant === 'default'
				? chroma(userTheme.current['background']).alpha(0.8).css()
				: userTheme.current['background'];

		const label = formatValue(
			this.props.label,
			this.props.label_options.fmt ?? this.axis?.options.fmt
		);

		return {
			type: 'line',
			markPoint: {
				data: [
					{
						name: 'point',
						coord: [this.props.x, this.props.y]
					}
				],
				animation: false,
				emphasis: {
					disabled: true
				},
				label: {
					show: Boolean(label),
					position: this.props.label_options.position,
					align: this.props.label_options.align,
					width: this.props.label_options.width,
					overflow: 'break',
					color:
						this.props.label_options.color ??
						this.props.color ??
						userTheme.current['muted-foreground'],
					backgroundColor: this.props.label_options.background_color ?? defaultLabelBackgroundColor,
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
				symbol: this.props.symbol_options.shape,
				symbolSize: this.props.symbol_options.size,
				itemStyle: {
					color:
						this.props.symbol_options.color ??
						this.props.color ??
						userTheme.current['muted-foreground']
				}
			}
		};
	}

	constructor(
		readonly propsGetter: () => ReferencePointStaticProps,
		readonly xAxis: XAxisModel,
		readonly yAxis: YAxisModel
	) {
		this.props = $derived(this.propsGetter());
	}
}
