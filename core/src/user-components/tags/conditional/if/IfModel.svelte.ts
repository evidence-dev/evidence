import { UserComponentModel } from '../../../UserComponentModel/UserComponentModel.svelte';
import type { UserComponentModelInit, WithDefaults } from '../../../UserComponentModel/types';
import {
	processColumnExpression,
	type ProcessedColumnExpression
} from '../../../common/sql-expression-utils';
import type { SQLQueryConfig } from '../../../common/sql-options';
import { Query, type SerializedQuery } from '../../../../Query.svelte';
import type { UserComponentProps } from '../../../types';
import type { schema } from './schema';
import { extractSQLProps } from '../../../common/sql-options';

type IfAttributes = UserComponentProps<typeof schema>;

type SerializedIf = {
	query: SerializedQuery;
};

type IfModelGenerics = WithDefaults<{
	Attributes: IfAttributes;
	Serialized: SerializedIf;
}>;

export class IfModel extends UserComponentModel<IfModelGenerics> {
	readonly query: Query;

	constructor(init: UserComponentModelInit<IfModelGenerics>) {
		super(init, {
			validChildClasses: undefined
		});

		this.query = new Query(() => this.queryConfig, init.deps, {}, init.serialized?.query);
	}

	// Resolve attributes with variable interpolation
	readonly resolvedData = $derived(this.resolveText(this.attributes.data));
	readonly resolvedWhere = $derived(this.resolveSql(this.attributes.where));

	readonly queryConfig: SQLQueryConfig | undefined = $derived.by(() => {
		if (this.hasBlockingError) {
			return undefined;
		}
		const sqlProps = extractSQLProps(this.attributes);
		return {
			// Left raw on purpose: generateSQLQuery resolves and quotes it. Resolving an
			// inline query here would leave a subquery for that guard to quote as a name.
			tableExpressionName: this.resolvedData,
			columns: [this.processedColumn],
			filterIds: this.attributes.filters,
			...sqlProps,
			where: this.resolvedWhere
		};
	});

	readonly processedColumn: ProcessedColumnExpression = $derived(
		processColumnExpression(
			{ value: 'COUNT(*) as row_count', type: 'measure' },
			this.deps.connection.dialect
		)
	);

	async init(): Promise<void> {
		await this.query.init();
	}

	toSerialized(): SerializedIf {
		return {
			query: this.query.toSerialized()
		};
	}
}
