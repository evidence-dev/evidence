/**
 * @typedef {Object} EvidenceDropdownContext
 * @property {({ value: any, label: string }) => () => void} registerOption
 */
export const DropdownContext = Symbol('EVIDENCE_DROPDOWN_CTX');
