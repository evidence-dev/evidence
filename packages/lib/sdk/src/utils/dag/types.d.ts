import { DagNode } from './DagNode.js';
import type { AccessTracked } from '../proxies/access-track/AccessTrack.js';

export interface WithDag {
	__dag: DagNode;
}

export type DagManager = AccessTracked & {
	dagMap: Map<string, DagNode>;
	resultToDagNode: (result: string[]) => Record<string, DagNode | null>;
};
