import { defineConfig, devices } from 'playwright/test';

/**
 * @type {import('playwright/test').PlaywrightTestConfig}
 */
export default defineConfig({
    testDir: './tests',
    testMatch: /.*\.spec\.js/,
    use: {
        baseURL: 'http://127.0.0.1:8766',
        trace: 'on-first-retry'
    },
    webServer: {
        command: 'node server/index.js',
        url: 'http://127.0.0.1:8766',
        reuseExistingServer: !process.env.CI
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    // Silence logs from the webserver to keep test output clean
    reporter: [['list'], ['html', { open: 'never' }]]
});
