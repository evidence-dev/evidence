import type { Input } from '../inputs/Input.js';
export type InputManager = {
	update: (value: string, label?: string, other?: Record<string, any>) => void;
	__input: Input;
};
