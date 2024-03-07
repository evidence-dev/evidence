/**
 * @extends {Error}
 * @property {string[]} context
 */
export class EvidenceError extends Error {
    /**
     * @param {string} message
     * @param {string[] | string} [context]
     * @param {ErrorOptions} [opts]
     */
    constructor(message: string, context?: string | string[] | undefined, opts?: ErrorOptions | undefined);
    context: any[];
}
//# sourceMappingURL=EvidenceError.d.ts.map