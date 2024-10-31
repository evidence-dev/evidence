import type { Input } from '../inputs/Input.js';
import type { WithDag } from '../dag/types.d.ts';
import type { QueryValue } from '../../usql/query/Query.js';

type UseSqlFactory = Symbol;

export type InputManager = {
	update: (value: any | UseSqlFactory, label?: string, other?: Record<string, any>) => void;
	__input: Input;
	subscribe: (fn: (value: any) => void) => () => void;
	/**
	 * When provided to `.update`, the value will be derived using the sql fragment factory, rather than being
	 * explicitly passed in.
	 */
	UseSqlFactory: UseSqlFactory;

	updateDatasource: (data: WithDag) => void;
};

export type InputQueryOpts = {
	/** Column to be used as value when selected */
	value?: string;
	/** Column to be used as label for each value */
	label?: string;
	/** any additional fields to include (e.g. not value or label) */
	select?: string | string[] | Record<string, string>;
	/** Table or subquery to select from */
	data?: string | QueryValue;
	/** Where clause for dataset */
	where?: string;
	/** Order by clause for dataset */
	order?: string;
};