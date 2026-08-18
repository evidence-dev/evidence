import type { UserComponentProps } from '../../../../../types';
import type { schema } from './schema';

export type ReferenceLineProps = UserComponentProps<typeof schema>;

export type ReferenceLineStaticProps = Omit<ReferenceLineProps, 'data'>;

export type ReferenceLineDynamicProps = ReferenceLineProps & {
	data: string;
	label?: string;
	x?: string;
	y?: string;
	x1?: string;
	y1?: string;
	x2?: string;
	y2?: string;
};
