import type { UserComponentProps } from '../../../../../types';
import type { schema } from './schema';

export type ReferenceAreaProps = UserComponentProps<typeof schema>;

export type ReferenceAreaStaticProps = Omit<ReferenceAreaProps, 'data'>;

export type ReferenceAreaDynamicProps = ReferenceAreaProps & {
	data: string;
	x_min?: string;
	x_max?: string;
	y_min?: string;
	y_max?: string;
};
