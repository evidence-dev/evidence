export type useInputOptions = {
	sqlFragmentFactory: (input: Input) => string;
	debouncePeriod?: number;
};
