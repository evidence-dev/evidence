import type { UserComponentProps } from '../../../types';
import {
	UserComponentModel,
	type WithDefaults,
	type UserComponentModelInit
} from '../../../UserComponentModel';
import { TableModel } from '../TableModel.svelte';
import type { schema } from './schema';
import type { UnifiedColumnDefinition } from '../unified-column-definition.types';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../../common/sql-expression-utils';
import { getDefaultFormatForDateGrain } from '../../../common/date-options';

type PivotAttributes = UserComponentProps<typeof schema>;

type PivotModelGenerics = WithDefaults<{
	Attributes: PivotAttributes;
	ParentRequired: true;
	ValidParents: [typeof TableModel];
	ValidChildren: [];
}>;

export class PivotModel extends UserComponentModel<PivotModelGenerics> {
	constructor(init: UserComponentModelInit<PivotModelGenerics>) {
		super(init, {
			parentRequired: true,
			validParentClasses: [TableModel],
			validChildClasses: []
		});
	}

	// Resolve attributes with variable interpolation
	readonly resolvedValue = $derived(this.resolveColumn(this.attributes.value));
	readonly resolvedFmt = $derived(this.resolveText(this.attributes.fmt));
	readonly resolvedDateGrain = $derived(this.resolveText(this.attributes.date_grain));

	readonly column: UnifiedColumnDefinition | undefined = $derived.by(() => {
		if (this.hasBlockingError) return undefined;

		const { sort } = this.attributes;
		const fmt = this.resolvedFmt ?? getDefaultFormatForDateGrain(this.resolvedDateGrain);

		const { sqlWithAlias, sqlWithoutAlias, alias, isComplexExpression, isTemporalDateGrain } =
			this.processedColumn;

		return {
			type: 'pivot',
			processedColumnExpression: this.processedColumn,
			sqlWithAlias,
			alias,
			columnIdForRendering: alias, // For pivots, always use the alias
			sqlWithoutAlias, // The expression after transformations but without alias
			isComplexExpression, // Track complexity for subtotal handling
			fmt,
			date_grain: this.resolvedDateGrain,
			sort,
			isTemporalDateGrain: isTemporalDateGrain
		};
	});

	private readonly processedColumn: ProcessedColumnExpression = $derived.by(() => {
		return processColumnExpression(
			{
				value: this.resolvedValue,
				type: 'pivot',
				dateGrain: this.resolvedDateGrain,
				firstDayOfWeek: this.projectSettings.first_day_of_week
			},
			this.deps.connection.dialect
		);
	});
}
