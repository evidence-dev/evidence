import type { UserComponentProps } from '../../../../../types';
import type { schema } from './schema';

export type ReferencePointProps = UserComponentProps<typeof schema>;

export type ReferencePointStaticProps = Omit<ReferencePointProps, 'data'> & {
	labelAxis?: 'x' | 'y' | undefined;
};

export type ReferencePointDynamicProps = ReferencePointProps & {
	data: string;
	x: string;
	y: string;
};
