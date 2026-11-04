/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      instances: [
        {
          browser: 'chromium',
          headless: true,
          launch: {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          }
        },
      ],
    },
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.stryker-tmp/**', '**/reports/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'node_modules/',
        'dist/',
        'examples/',
        'scripts/**',
        'tests/',
        '__tests__/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})