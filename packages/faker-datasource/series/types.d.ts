import { Faker } from '@faker-js/faker';

type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

export type FakerSpec<
	Category extends keyof Faker = keyof Faker,
	Item extends keyof Faker[Category] = keyof Faker[Category]
> = {
	category: Category;
	item: Item;
	options: Parameters<
		Faker[Category][Item] extends (...args: any[]) => any ? Faker[Category][Item] : never
	>;
	targetField?: keyof ReturnType<
		Faker[Category][Item] extends (...args: any[]) => any ? Faker[Category][Item] : never
	>;
};

export type SeriesCol = {
	name: string;
	category: string;
	item: string;
	options?: any[];
	targetField?: string;
};

export type GenNumericSeriesOpts = {
	columns: {
		x: SeriesCol;
		y: SeriesCol;
		series?: SeriesCol;
	};
};
