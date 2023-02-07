import { sveltekit } from "@sveltejs/kit/vite"
import { outputFile } from "fs-extra"

/** @type {import('vite').UserConfig} */
const config = {
    test: {
        reporters: process.env.CI  ? 'junit ' : 'verbose',
        outputFile: process.env.CI ? 'report.xml' : ''
    },
    plugins: [sveltekit()],
    optimizeDeps: {
        include: ['echarts-stat'],
        exclude: ['@evidence-dev/components']
    },
    ssr: {
        external: ['@evidence-dev/db-orchestrator', '@evidence-dev/telemetry', 'blueimp-md5']
    }
}

export default config