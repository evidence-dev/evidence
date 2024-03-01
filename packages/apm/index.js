const {
    BasicTracerProvider,
    SimpleSpanProcessor
} = require('@opentelemetry/sdk-trace-node');
const opentelemetry = require("@opentelemetry/api")
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { AsyncHooksContextManager } = require("@opentelemetry/context-async-hooks");

const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

const otlpExporter = new OTLPTraceExporter({
    url: 'https://evidencebriantempo.share.zrok.io/v1/traces', // TODO: Make configurable
});

const provider = new BasicTracerProvider({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'Evidence' // TODO: Address this deprecation
    })
})
provider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter))
provider.register()

// Set up context manager, this makes it possible to pass parent spans down
const contextManager = new AsyncHooksContextManager();
contextManager.enable();
opentelemetry.context.setGlobalContextManager(contextManager);

// Get the actual tracer
const tracer = opentelemetry.trace.getTracer("EvidenceTracer")

const ParentSpan = Symbol("ParentSpan")

/**
 * @typedef {(...args: any[]) => any} SomeFunc
 */

/**
 * @template {SomeFunc} F
 * @template T
 * @typedef {T | ((...args: Parameters<F>) => T)} MaybeFunc
 */

/**
 * @template {SomeFunc} T
 * @param {MaybeFunc<T, string>} title
 * @param {T} fn
 * @param {MaybeFunc<T, Record<string,any>>} [attrs]
 * @param {APMSpan} [rootTrace]
 * @returns {T}
 */
function annotate(
    title, fn, attrs, rootTrace
) {
    /**
     * @param {Parameters<T>} args
     * @returns {ReturnType<T>}
    */
    const wrap = (...args) => trace(
        typeof title === "function" ? title(...args) : title,
        () => fn(...args),
        typeof attrs === "function" ? attrs(...args) : attrs,
        rootTrace
    )
    // @ts-expect-error
    return wrap
}

/**
 * @template {(span?: APMSpan) => any} T
 * @param {string} title
 * @param {T} work
 * @param {Record<string,any>} [attrs]
 * @param {APMSpan} [rootTrace]
 * @returns {ReturnType<T>}
 */
function trace(
    title,
    work,
    attrs,
    rootTrace
) {
    const [span, activeContext] = start(title, attrs, rootTrace)

    try {
        const result = contextManager.with(activeContext.setValue(ParentSpan, span), () => work(span))
        if (result instanceof Promise) {
            return (
                /** @type {ReturnType<T>} */
                (result.then((v) => {
                    stop(span)
                    return v
                }).catch((e) => {
                    stop(span, 2)
                    throw e
                })))
        } else {
            stop(span)
            return result;
        }
    } catch (e) {
        stop(span, e)
        throw e
    }
}

const t = Symbol("x")
/**
 * @param {string} title
 * @param {Record<string,any>} [attrs]
 * @param {APMSpan} [rootTrace]
 * @returns {[APMSpan, APMContext]}
 */
function start(title, attrs, rootTrace) {
    const activeContext = opentelemetry.context.active()
    // Prefer the "real" active span

    const parentSpan = /** @type {APMSpan} */ (opentelemetry.trace.getActiveSpan() ?? activeContext.getValue(ParentSpan))
    let ctx
    if (rootTrace && rootTrace !== parentSpan) {
        
        // console.log("\n\n---\n\n")
        const traceCtx = opentelemetry.trace.setSpan(activeContext, rootTrace);
        // console.log(rootTrace)
        // console.log(traceCtx)
        traceCtx.setValue(t, title)
        ctx = traceCtx
        // ctx = opentelemetry.trace.setSpan(traceCtx, parentSpan);
        // console.log(ctx)
        // console.log(ctx.getValue(t))
        // console.log("\n\n---\n\n")
    } else {
        ctx = opentelemetry.trace.setSpan(activeContext, parentSpan);
    }

    const span = tracer.startSpan(title, undefined, ctx)
    if (attrs) span.setAttributes(attrs)

    return [span, activeContext]
}

/**
 * @param {APMSpan} span
 * @param {unknown} [error]
 * @param {import("@opentelemetry/api").TimeInput} [realStoptime]
 * @returns {void}
 */
function stop(span, error, realStoptime) {
    if (error instanceof Error)
            span.recordException(error)
        else if (error)
            span.recordException(new Error(error?.toString() ?? "Unknown Error" , { cause: error }))
        
    span.end(realStoptime);
}

process.addListener('beforeExit', async () => {
    // Clean up; this might not actually be needed
    await provider.forceFlush();
    await otlpExporter.forceFlush();
    await provider.shutdown();
    await otlpExporter.shutdown();
})

module.exports = {
    annotate,
    trace,
    start,
    stop
}

/** @typedef {import("@opentelemetry/api").Span} APMSpan */
/** @typedef {import("@opentelemetry/api").Context} APMContext */