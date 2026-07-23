import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  webServer: {
    command: 'node tests/server.js',
    port: 8085,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:8085',
    headless: true,
  },
});
