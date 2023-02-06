import { sveltekit } from "@sveltejs/kit/vite"
import evidencePreprocess from '@evidence-dev/preprocess'
import adapter from "@sveltejs/adapter-static"
/** @type {import('vite').UserConfig} */
const config = {
    plugins: [sveltekit()],
    preprocess: [evidencePreprocess(true)],
    optimizeDeps: {
        include: ['echarts-stat'],
        exclude: ['@evidence-dev/components']
    },
    kit: {
        adapter: adapter({
            strict: false // TODO: figure out how to make build work without this
        }),
    },
    ssr: {
        external: ['@evidence-dev/db-orchestrator', '@evidence-dev/telemetry', 'blueimp-md5']
    }
}

export default config