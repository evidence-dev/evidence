import type { SeriesOption } from 'echarts';
import type { ReferenceAreaStaticProps } from './types';
import { userTheme } from '../../../../../user-theme.svelte';
import { safeChroma } from '../../../../../../safeChroma';
import { mode } from 'mode-watcher';

export class ReferenceAreaStaticModel {
	readonly props: ReferenceAreaStaticProps;

	get series(): SeriesOption {
		return {
			type: 'line',
			markArea: {
				data: [
					[
						{
							xAxis: this.props.x_min,
							yAxis: this.props.y_min
						},
						{
							xAxis: this.props.x_max,
							yAxis: this.props.y_max
						}
					]
				],
				animation: false,
				emphasis: {
					disabled: true
				},
				label: {
					show: Boolean(this.props.label),
					position: this.props.label_options.position,
					align: this.props.label_options.align,
					color:
						this.props.label_options.color ??
						this.props.color ??
						userTheme.current['muted-foreground'],
					backgroundColor: this.props.label_options.background_color,
					padding: this.props.label_options.padding,
					fontSize: this.props.label_options.text.size,
					fontStyle: this.props.label_options.text.italic ? 'italic' : 'normal',
					fontWeight: this.props.label_options.text.bold ? 'bold' : 'normal',
					borderWidth: this.props.label_options.border.width,
					borderType: this.props.label_options.border.type,
					borderColor: this.props.label_options.border.color ?? userTheme.current['border'],
					borderRadius: this.props.label_options.border.radius,
					formatter: () => this.props.label ?? ''
				},
				itemStyle: {
					color:
						this.props.area_options.color ??
						safeChroma(this.props.color)
							?.alpha(mode.current === 'dark' ? 0.15 : 0.1)
							.css(),
					opacity: this.props.area_options.opacity,
					borderWidth: this.props.area_options.border.width,
					borderType: this.props.area_options.border.type,
					borderColor: this.props.area_options.border.color
				}
			}
		};
	}

	constructor(readonly propsGetter: () => ReferenceAreaStaticProps) {
		this.props = $derived(this.propsGetter());
	}
}
