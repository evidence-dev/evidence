// vite.config.js
import { sveltekit } from "file:///home/zach/code/evidence/evidence/node_modules/.pnpm/@sveltejs+kit@2.5.4_@sveltejs+vite-plugin-svelte@3.0.2_svelte@4.2.19_vite@5.4.6/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { sourceQueryHmr } from "file:///home/zach/code/evidence/evidence/packages/lib/sdk/src/build-dev/vite/plugins.js";
var config = {
  plugins: [sveltekit(), sourceQueryHmr()],
  optimizeDeps: {
    include: ["echarts-stat", "echarts"],
    exclude: ["svelte-icons"]
  },
  ssr: {
    external: [
      "@evidence-dev/db-orchestrator",
      "@evidence-dev/telemetry",
      "blueimp-md5",
      "@evidence-dev/plugin-connector",
      "@evidence-dev/sdk/plugins"
    ]
  },
  server: {
    fs: {
      strict: process.env.NODE_ENV !== "development"
    },
    hmr: {
      overlay: false
    }
  },
  build: {
    rollupOptions: {
      external: [/^@evidence-dev\/tailwind\/fonts\//]
    }
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS96YWNoL2NvZGUvZXZpZGVuY2UvZXZpZGVuY2Uvc2l0ZXMvZXhhbXBsZS1wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS96YWNoL2NvZGUvZXZpZGVuY2UvZXZpZGVuY2Uvc2l0ZXMvZXhhbXBsZS1wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3phY2gvY29kZS9ldmlkZW5jZS9ldmlkZW5jZS9zaXRlcy9leGFtcGxlLXByb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tICdAc3ZlbHRlanMva2l0L3ZpdGUnO1xuaW1wb3J0IHsgc291cmNlUXVlcnlIbXIgfSBmcm9tICdAZXZpZGVuY2UtZGV2L3Nkay92aXRlJztcblxuLyoqIEB0eXBlIHtpbXBvcnQoJ3ZpdGUnKS5Vc2VyQ29uZmlnfSAqL1xuY29uc3QgY29uZmlnID0ge1xuXHRwbHVnaW5zOiBbc3ZlbHRla2l0KCksIHNvdXJjZVF1ZXJ5SG1yKCldLFxuXHRvcHRpbWl6ZURlcHM6IHtcblx0XHRpbmNsdWRlOiBbJ2VjaGFydHMtc3RhdCcsICdlY2hhcnRzJ10sXG5cdFx0ZXhjbHVkZTogWydzdmVsdGUtaWNvbnMnXVxuXHR9LFxuXHRzc3I6IHtcblx0XHRleHRlcm5hbDogW1xuXHRcdFx0J0BldmlkZW5jZS1kZXYvZGItb3JjaGVzdHJhdG9yJyxcblx0XHRcdCdAZXZpZGVuY2UtZGV2L3RlbGVtZXRyeScsXG5cdFx0XHQnYmx1ZWltcC1tZDUnLFxuXHRcdFx0J0BldmlkZW5jZS1kZXYvcGx1Z2luLWNvbm5lY3RvcicsXG5cdFx0XHQnQGV2aWRlbmNlLWRldi9zZGsvcGx1Z2lucydcblx0XHRdXG5cdH0sXG5cdHNlcnZlcjoge1xuXHRcdGZzOiB7XG5cdFx0XHRzdHJpY3Q6IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAnZGV2ZWxvcG1lbnQnXG5cdFx0fSxcblx0XHRobXI6IHtcblx0XHRcdG92ZXJsYXk6IGZhbHNlXG5cdFx0fVxuXHR9LFxuXHRidWlsZDoge1xuXHRcdHJvbGx1cE9wdGlvbnM6IHtcblx0XHRcdGV4dGVybmFsOiBbL15AZXZpZGVuY2UtZGV2XFwvdGFpbHdpbmRcXC9mb250c1xcLy9dXG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVWLFNBQVMsaUJBQWlCO0FBQ2pYLFNBQVMsc0JBQXNCO0FBRy9CLElBQU0sU0FBUztBQUFBLEVBQ2QsU0FBUyxDQUFDLFVBQVUsR0FBRyxlQUFlLENBQUM7QUFBQSxFQUN2QyxjQUFjO0FBQUEsSUFDYixTQUFTLENBQUMsZ0JBQWdCLFNBQVM7QUFBQSxJQUNuQyxTQUFTLENBQUMsY0FBYztBQUFBLEVBQ3pCO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSixVQUFVO0FBQUEsTUFDVDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0gsUUFBUSxRQUFRLElBQUksYUFBYTtBQUFBLElBQ2xDO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSixTQUFTO0FBQUEsSUFDVjtBQUFBLEVBQ0Q7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNOLGVBQWU7QUFBQSxNQUNkLFVBQVUsQ0FBQyxtQ0FBbUM7QUFBQSxJQUMvQztBQUFBLEVBQ0Q7QUFDRDtBQUVBLElBQU8sc0JBQVE7IiwKICAibmFtZXMiOiBbXQp9Cg==
