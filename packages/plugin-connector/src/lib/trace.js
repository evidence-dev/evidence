import Module from "node:module";

const require = Module.createRequire(import.meta.url);

let _trace
let _annotate
try {
    const apm = require("@evidence-dev/apm")
    _trace = apm.trace
    _annotate = apm.annotate
} catch (e) {
    console.log("APM Not Found, falling back to defaults", e)
    /**
     * @template {CallableFunction} T
     * @param {string} _
     * @param {T} fn
     * @returns {ReturnType<T>}
     */
    _trace = (_, fn) => fn()

    /**
     * @template {CallableFunction} T
     * @param {string} _
     * @param {T} fn
     * @returns {T}
     */
    _annotate = (_, fn) => fn
}

export const trace = _trace
export const annotate = _annotate
