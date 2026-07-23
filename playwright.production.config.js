import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  webServer: {
    command: 'node tests/server.js',
    port: 8091,
    reuseExistingServer: false,
    env: {
      PORT: '8091',
      PUBLIC_DIR: 'dist'
    }
  },
  use: {
    baseURL: 'http://localhost:8091',
    headless: true
  }
});
