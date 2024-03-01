import Module from "node:module";

const require = Module.createRequire(import.meta.url);

/** @type {import("@evidence-dev/apm").trace} */
let _trace
/** @type {import("@evidence-dev/apm").annotate} */
let _annotate

try {
    const apm = require("@evidence-dev/apm")
    _trace = apm.trace
    _annotate = apm.annotate
} catch (e) {
    console.log("APM Not Found, falling back to defaults", e)
    
    /** @type {import("@evidence-dev/apm").trace} */
    _trace = (_, fn) => fn()

    /**
     * @type {import("@evidence-dev/apm").annotate}
     */
    _annotate = (_, fn) => fn
}

export const trace = _trace
export const annotate = _annotate
