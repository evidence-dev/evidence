import type { Input } from '../inputs/Input.js';
export type InputManager = {
	update: (newValue: any) => void;
	__input: Input;
};
