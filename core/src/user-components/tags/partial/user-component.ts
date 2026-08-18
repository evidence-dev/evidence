import type { UserComponent } from '../../types';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema
};
