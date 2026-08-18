import { type UserComponentProps } from '../../../types';
import type { schema } from './schema';
import type { UnifiedColumnDefinition } from '../unified-column-definition.types';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../../common/sql-expression-utils';
import { TableModel } from '../TableModel.svelte';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../../UserComponentModel';
import { getDefaultFormatForDateGrain } from '../../../common/date-options';

type DimensionAttributes = UserComponentProps<typeof schema>;

type DimensionModelGenerics = WithDefaults<{
	Attributes: DimensionAttributes;
	ParentRequired: true;
	ValidParents: [typeof TableModel];
	ValidChildren: [];
}>;

export class DimensionModel extends UserComponentModel<DimensionModelGenerics> {
	constructor(init: UserComponentModelInit<DimensionModelGenerics>) {
		super(init, {
			parentRequired: true,
			validParentClasses: [TableModel],
			validChildClasses: []
		});
	}

	// Resolve attributes with variable interpolation
	readonly resolvedValue = $derived(this.resolveColumn(this.attributes.value));
	readonly resolvedTitle = $derived(this.resolveText(this.attributes.title));
	readonly resolvedInfo = $derived(this.resolveText(this.attributes.info));
	readonly resolvedInfo_link = $derived(this.resolveText(this.attributes.info_link));
	readonly resolvedInfo_link_title = $derived(this.resolveText(this.attributes.info_link_title));
	readonly resolvedFmt = $derived(this.resolveText(this.attributes.fmt));
	readonly resolvedImage = $derived(this.resolveColumn(this.attributes.image));
	readonly resolvedLogo = $derived(this.resolveColumn(this.attributes.logo));
	readonly resolvedLink = $derived(this.resolveColumn(this.attributes.link));
	readonly resolvedLinkLabel = $derived(this.resolveText(this.attributes.link_label));
	readonly resolvedDateGrain = $derived(this.resolveText(this.attributes.date_grain));
	readonly resolvedHide = $derived(this.resolveBoolean(this.attributes.hide));
	readonly resolvedRepeatValues = $derived(this.attributes.repeat_values);
	readonly resolvedConditionalColors = $derived(
		this.resolveColumn(this.attributes.conditional_colors)
	);

	readonly columns: UnifiedColumnDefinition[] = $derived.by(() => {
		if (this.hasBlockingError) return [];

		return [
			this.dimension,
			this.imageMeasure,
			this.logoMeasure,
			this.linkMeasure,
			this.conditionalColorsMeasure
		].filter((x): x is NonNullable<typeof x> => Boolean(x));
	});

	readonly dimension: UnifiedColumnDefinition = $derived.by(() => {
		const { sqlWithAlias, sqlWithoutAlias, alias, isComplexExpression, isTemporalDateGrain } =
			this.processedColumn;

		const fmt = this.resolvedFmt ?? getDefaultFormatForDateGrain(this.resolvedDateGrain);

		// When conditional_colors is present, attach viz:'color' and color_options
		// so the existing color viz rendering path handles dimension cells too
		const conditionalColorsMeasure = this.conditionalColorsMeasure;
		const colorVizProps: Partial<UnifiedColumnDefinition> = conditionalColorsMeasure
			? {
					viz: 'color',
					color_options: {
						conditional_colors: conditionalColorsMeasure.alias,
						scale_mode: 'individual' as const
					},
					fragmentColumnAliases: [conditionalColorsMeasure.alias]
				}
			: {};

		return {
			type: 'dimension',
			processedColumnExpression: this.processedColumn,
			sqlWithAlias,
			alias,
			columnIdForRendering: alias,
			sqlWithoutAlias,
			isComplexExpression,
			// Display properties
			title: this.resolvedTitle,
			align: this.attributes.align,
			info: this.resolvedInfo,
			info_link: this.resolvedInfo_link,
			info_link_title: this.resolvedInfo_link_title,
			wrap: this.attributes.wrap,
			hide: this.resolvedHide as boolean | undefined,
			date_grain: this.resolvedDateGrain,
			fmt,
			sort: this.attributes.sort,
			isTemporalDateGrain: isTemporalDateGrain,
			// Content and link properties (flat)
			html: this.attributes.html,
			image_options: this.attributes.image_options,
			image: this.resolvedImage,
			logo: this.resolvedLogo,
			logo_options: this.attributes.logo_options,
			link: this.resolvedLink,
			link_label: this.resolvedLinkLabel,
			link_new_tab: this.attributes.link_new_tab,
			// Column grouping
			column_group: this.attributes.column_group,
			// Repeat control
			repeat_values: this.resolvedRepeatValues,
			// Conditional colors (reuses the measure color viz path)
			...colorVizProps
		};
	});

	readonly imageMeasure: UnifiedColumnDefinition | undefined = $derived.by(() => {
		if (!this.resolvedImage) return undefined;

		const { alias } = this.processedColumn;
		const image = this.resolvedImage;
		const { dialect } = this.deps.queryService;

		return {
			type: 'measure',
			processedColumnExpression: {
				sqlWithAlias: `${dialect.anyValue(image)} AS __image_${alias}`,
				sqlWithoutAlias: dialect.anyValue(image),
				sqlWithoutDateFiltersOrAlias: dialect.anyValue(image),
				alias: `__image_${alias}`,
				displayAlias: `__image_${alias}`,
				type: 'measure',
				isComplexExpression: false,
				hasAgg: true,
				isTemporalDateGrain: false,
				hasDateGrain: false,
				hasDateRange: false,
				isTableComparison: false,
				isTableSparkline: false
			},
			sqlWithAlias: `${dialect.anyValue(image)} AS __image_${alias}`,
			alias: `__image_${alias}`,
			columnIdForRendering: `__image_${alias}`,
			sqlWithoutAlias: dialect.anyValue(image),
			isComplexExpression: false,
			hide: true, // Always hidden
			align: 'left'
		};
	});

	readonly logoMeasure: UnifiedColumnDefinition | undefined = $derived.by(() => {
		if (!this.resolvedLogo) return undefined;

		const { alias } = this.processedColumn;
		const logo = this.resolvedLogo;
		const { dialect } = this.deps.queryService;

		return {
			type: 'measure',
			processedColumnExpression: {
				sqlWithAlias: `${dialect.anyValue(logo)} AS __logo_${alias}`,
				sqlWithoutAlias: dialect.anyValue(logo),
				sqlWithoutDateFiltersOrAlias: dialect.anyValue(logo),
				alias: `__logo_${alias}`,
				displayAlias: `__logo_${alias}`,
				type: 'measure',
				isComplexExpression: false,
				hasAgg: true,
				isTemporalDateGrain: false,
				hasDateGrain: false,
				hasDateRange: false,
				isTableComparison: false,
				isTableSparkline: false
			},
			sqlWithAlias: `${dialect.anyValue(logo)} AS __logo_${alias}`,
			alias: `__logo_${alias}`,
			columnIdForRendering: `__logo_${alias}`,
			sqlWithoutAlias: dialect.anyValue(logo),
			isComplexExpression: false,
			hide: true, // Always hidden
			align: 'left'
		};
	});

	readonly linkMeasure: UnifiedColumnDefinition | undefined = $derived.by(() => {
		if (!this.resolvedLink) return undefined;

		const { alias } = this.processedColumn;
		const link = this.resolvedLink;
		const { dialect } = this.deps.queryService;

		return {
			type: 'measure',
			processedColumnExpression: {
				sqlWithAlias: `${dialect.anyValue(link)} AS __link_${alias}`,
				sqlWithoutAlias: dialect.anyValue(link),
				sqlWithoutDateFiltersOrAlias: dialect.anyValue(link),
				alias: `__link_${alias}`,
				displayAlias: `__link_${alias}`,
				type: 'measure',
				isComplexExpression: false,
				hasAgg: true,
				isTemporalDateGrain: false,
				hasDateGrain: false,
				hasDateRange: false,
				isTableComparison: false,
				isTableSparkline: false
			},
			sqlWithAlias: `${dialect.anyValue(link)} AS __link_${alias}`,
			alias: `__link_${alias}`,
			columnIdForRendering: `__link_${alias}`,
			sqlWithoutAlias: dialect.anyValue(link),
			isComplexExpression: false,
			hide: true, // Always hidden
			align: 'left'
		};
	});

	readonly conditionalColorsMeasure: UnifiedColumnDefinition | undefined = $derived.by(() => {
		if (!this.resolvedConditionalColors) return undefined;

		const { alias: dimensionAlias } = this.processedColumn;
		const ccAlias = this.deps.queryService.dialect.formatAlias(`__cc_${dimensionAlias}`);

		const processed = processColumnExpression(
			{
				value: this.resolvedConditionalColors,
				type: 'measure',
				firstDayOfWeek: this.projectSettings.first_day_of_week
			},
			this.deps.queryService.dialect
		);

		// Use a stable alias derived from the dimension name (__cc_<dim>) to
		// guarantee uniqueness — two dimensions with identical conditional_colors
		// SQL would collide if we derived from the expression.
		const sqlExpression = processed.hasAgg
			? `${processed.sqlWithoutAlias} AS ${ccAlias}`
			: `${this.deps.queryService.dialect.anyValue(processed.sqlWithoutAlias)} AS ${ccAlias}`;

		const finalProcessed = processColumnExpression(
			{
				value: sqlExpression,
				type: 'measure',
				firstDayOfWeek: this.projectSettings.first_day_of_week
			},
			this.deps.queryService.dialect
		);

		return {
			type: 'measure',
			processedColumnExpression: finalProcessed,
			sqlWithAlias: finalProcessed.sqlWithAlias,
			alias: finalProcessed.alias,
			columnIdForRendering: finalProcessed.alias,
			sqlWithoutAlias: finalProcessed.sqlWithoutAlias,
			isComplexExpression: finalProcessed.isComplexExpression,
			hide: true,
			align: 'right'
		};
	});

	private readonly processedColumn: ProcessedColumnExpression = $derived.by(() => {
		return processColumnExpression({
			value: this.resolvedValue,
			type: 'dimension',
			dateGrain: this.resolvedDateGrain,
			firstDayOfWeek: this.projectSettings.first_day_of_week
		}, this.deps.queryService.dialect);
	});
}
