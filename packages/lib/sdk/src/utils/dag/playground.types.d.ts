import { DagNode } from './DagNode.js';
import { Input } from './playground.js';
export interface WithDag {
	__dag: DagNode;
}

export interface InputChild {
	rootInput: Input;
}
