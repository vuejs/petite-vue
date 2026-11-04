import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PocketVue',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => {
        if (format === 'es') return 'pocket-vue.es.js'
        if (format === 'umd') return 'pocket-vue.umd.js'
        if (format === 'iife') return 'pocket-vue.iife.js'
        return `pocket-vue.${format}.js`
      }
    },
    rollupOptions: {
      plugins: [
        {
          name: 'remove-collection-handlers',
          transform(code, id) {
            if (id.endsWith('reactivity.esm-bundler.js')) {
              return code
                .replace(`mutableCollectionHandlers,`, `null,`)
                .replace(`readonlyCollectionHandlers,`, `null,`)
            }
          }
        }
      ]
    }
  }
})
