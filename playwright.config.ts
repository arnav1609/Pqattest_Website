import { defineConfig } from '@playwright/test';

// Tests run against the built static site (vite preview), so they also prove the dist works when served locally.
export default defineConfig({
  testDir: 'tests',
  timeout: 120_000,
  workers: 1,            // software-rendered WebGL: parallel pages starve each other
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 900 }, launchOptions: { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } },
  webServer: { command: 'npx vite preview --port 4173 --strictPort --host 127.0.0.1', url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 60_000 }
});
