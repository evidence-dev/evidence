import Module from "node:module";

const require = Module.createRequire(import.meta.url);

/** @type {import("@evidence-dev/apm").trace} */
let _trace
/** @type {import("@evidence-dev/apm").annotate} */
let _annotate
/** @type {import("@evidence-dev/apm").start} */
let _start
/** @type {import("@evidence-dev/apm").stop} */
let _stop

const useDefaults = () => {
    /** @type {import("@evidence-dev/apm").trace} */
    _trace = (_, fn) => fn()
    /**
     * @type {import("@evidence-dev/apm").annotate}
     */
    _annotate = (_, fn) => fn
    /**
     * @type {import("@evidence-dev/apm").start}
     */
    _start = () => []
    /**
     * @type {import("@evidence-dev/apm").stop}
     */
    _stop = () => { }
}
if (process.env.EVIDENCE_DISABLE_APM) useDefaults()
else
    try {
        const apm = require("@evidence-dev/apm")
        _trace = apm.trace
        _annotate = apm.annotate
        _start = apm.start
        _stop = apm.stop
    } catch (e) {
        console.log("APM Not Found, falling back to defaults", e)
        useDefaults()
    }

export const trace = _trace
export const annotate = _annotate
export const start = _start
export const stop = _stop



/**
 * @type {Map<string, import("@evidence-dev/apm").APMSpan>}
 */
const traces = new Map()

const cleanFilename = str => str?.replace(process.cwd(), "")
export const fileTraces = {
    /**
     * 
     * @param {string} filename 
     * @param {boolean} [requireRunning=false] 
     * @returns {import("@evidence-dev/apm").APMSpan | undefined}
     */
    get(filename, requireRunning = false) {
        const out = traces.get(cleanFilename(filename))
        if (!out) return out
        if (!out.isRecording() && requireRunning) {
            throw new Error("Expected span to currently be recording")
        }
        return out
    },
    set(filename, span) {
        return traces.set(cleanFilename(filename), span)
    },
    has(filename) {
        return traces.has(cleanFilename(filename))
    },
    reset() {
        traces.clear()
    }
}
