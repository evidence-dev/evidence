import { WithDag } from '../../dag/types.d.ts';
export type useInputOptions = {
	sqlFragmentFactory: (input: Input) => string;
	debouncePeriod?: number;
	dataSource?: WithDag;
};
