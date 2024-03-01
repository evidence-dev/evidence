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
 * @template {(...args: any[]) => any} T
 * @param {string | ((...args: Parameters<T>) => string)} title
 * @param {T} fn
 * @returns {T}
 */
function annotate(
    title, fn
) {
    /**
     * @param {Parameters<T>} args
     * @returns {ReturnType<T>}
    */
    const wrap = (...args) => trace(
        typeof title === "string" ? title : title(...args),
        () => fn(...args))
    // @ts-expect-error
    return wrap
}

/**
 * @template {(span?: import("@opentelemetry/api").Span) => any} T
 * @param {string} title
 * @param {T} work
 * @returns {ReturnType<T>}
 */
function trace(
    title,
    work
) {
    const activeContext = opentelemetry.context.active()
    // Prefer the "real" active span

    const parentSpan = /** @type {import("@opentelemetry/api").Span} */ (opentelemetry.trace.getActiveSpan() ?? activeContext.getValue(ParentSpan))

    const ctx = opentelemetry.trace.setSpan(activeContext, parentSpan);
    const span = tracer.startSpan(title, undefined, ctx)

    try {
        const result = contextManager.with(activeContext.setValue(ParentSpan, span), () => work(span))
        if (result instanceof Promise) {
            return (
                /** @type {ReturnType<T>} */
                (result.then((v) => {
                    span.end();
                    return v
                }).catch((e) => {
                    span.recordException(e)
                    span.end()
                    throw e
                })))
        } else {
            span.end();
            return result;
        }
    } catch (e) {
        if (e instanceof Error)
            span.recordException(e)
        else
            span.recordException(new Error("Unknown Error", { cause: e }))
        span.end()
        throw e
    }
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
    trace
}