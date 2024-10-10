import { WithDag } from '../../dag/types.d.ts';
import { Input } from '../../inputs/Input.js';
export type useInputOptions = {
	sqlFragmentFactory: (input: Input) => string;
	debouncePeriod?: number;
	dataSource?: WithDag;
};
