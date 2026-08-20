import { logger } from './shims/logger';
import type { FilterClass } from './Filter.svelte';
import type { UserComponent } from './user-components/types';

export const tags: Record<string, UserComponent> = Object.fromEntries(
	Object.entries(
		import.meta.glob<UserComponent>('./user-components/tags/**/user-component.ts', {
			eager: true,
			import: 'userComponent'
		})
	)
		.filter(([_path, userComponent]) => userComponent != null)
		.map(([_path, userComponent]) => {
			return [userComponent.schema.render, userComponent];
		})
		.filter(([name]) => name !== 'echarts' && name !== 'ReactiveVariable')
);

export const nodes: Record<string, UserComponent> = Object.fromEntries(
	Object.entries(
		import.meta.glob<UserComponent>('./user-components/nodes/**/user-component.ts', {
			eager: true,
			import: 'userComponent'
		})
	).map(([_path, userComponent]) => {
		return [userComponent.schema.render, userComponent];
	})
);

type UserComponentName = keyof typeof tags | keyof typeof nodes;

export const isUserComponent = (name: string): boolean => name in tags || name in nodes;

export const getUserComponent = (name: UserComponentName): UserComponent => {
	if (name in tags) return tags[name];
	if (name in nodes) return nodes[name];
	throw new Error(`User component "${name}" not found`);
};

// TODO instead of this, may be cleaner to have each Filter exist within the component's Model
export const getFilterClassByUserComponentName = (name: string): FilterClass | undefined => {
	const userComponent = tags[name] ?? nodes[name];
	if (!userComponent) {
		logger.error({ name }, 'Failed to find user component');
		return undefined;
	}

	const { Filter } = userComponent;
	return Filter;
};
