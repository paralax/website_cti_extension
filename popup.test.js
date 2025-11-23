/**
 * @jest-environment jsdom
 */

// --- Mocks Setup ---
// This block mocks all external dependencies and browser/extension APIs
// to ensure the tests run in a predictable, controlled environment.

// Mock Chrome Extension APIs
require('./__mocks__/chrome');

// Mock global browser APIs and third-party libraries
// window.crypto is read-only in JSDOM, so we must use Object.defineProperty
Object.defineProperty(window, 'crypto', {
    value: {
        ...window.crypto,
        randomUUID: jest.fn(() => 'mock-uuid-1234'),
    },
    writable: true,
});
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
window.alert = jest.fn();
global.JSZip = jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue('mock-zip-content'),
}));

// --- Test Suite ---

const fs = require('fs');
const path =require('path');
const html = fs.readFileSync(path.resolve(__dirname, './popup.html'), 'utf8');

// A promise utility to wait for the next tick, allowing async operations to complete.
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('popup.js', () => {

    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        jest.resetModules(); // Re-runs the script content for each test
        jest.clearAllMocks(); // Resets mock function call counters

        // Mock fetch to handle different API endpoints robustly
        global.fetch = jest.fn().mockImplementation((url) => {
            if (url.includes('v1beta/models')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ models: [] }),
                });
            }
            if (url.includes(':generateContent')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'Gemini Response' }] } }] }),
                });
            }
            return Promise.reject(new Error(`Unhandled fetch request: ${url}`));
        });
    });

    describe('Initialization Flow', () => {
        it('should show an API key prompt if no keys are stored', () => {
            chrome.storage.local.get.mockImplementation((keys, callback) => {
                callback({ geminiApiKeys: [], prompts: [] });
            });

            require('./popup.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));

            expect(document.getElementById('api-key-message').style.display).toBe('block');
        });

        it('should fetch models and show the main UI if API keys are stored', async () => {
            chrome.storage.local.get.mockImplementation((keys, callback) => {
                 callback({ geminiApiKeys: [{name: 'test', key: 'test-api-key'}], prompts: [] });
            });

            require('./popup.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));
            await flushPromises();

            expect(document.getElementById('main-content').style.display).toBe('block');
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('models?key=test-api-key'));
        });
    });

    describe('Download Functionality', () => {
        let mockLink;

        beforeEach(() => {
            chrome.storage.local.get.mockImplementation((keys, callback) => {
                callback({
                    geminiApiKeys: [{ name: 'test', key: 'test-api-key' }],
                    prompts: [{ name: 'Test Prompt', text: 'Summarize this page' }]
                });
            });

            const originalCreateElement = document.createElement;
            mockLink = { href: '', download: '', click: jest.fn() };
            document.createElement = jest.fn((tag) => {
                if (tag.toLowerCase() === 'a') return mockLink;
                return originalCreateElement.call(document, tag);
            });
        });

        it('should alert if download is clicked before processing the page', async () => {
            require('./popup.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));
            await flushPromises();

            document.getElementById('download-results').click();

            expect(window.alert).toHaveBeenCalledWith('Please process the page first to get the source code.');
            expect(mockLink.click).not.toHaveBeenCalled();
        });

        it('should trigger a download with a UUID after processing the page', async () => {
            chrome.tabs.query.mockImplementation((query, callback) => callback([{ id: 1 }]));
            chrome.tabs.sendMessage.mockImplementation((id, msg, callback) => callback({ sourceCode: '<html></html>' }));

            require('./popup.js');
            document.dispatchEvent(new Event('DOMContentLoaded'));
            await flushPromises();

            // Simulate selecting a prompt
            const promptSelect = document.getElementById('prompt-select');
            promptSelect.value = 0;

            document.getElementById('process-page').click();
            await flushPromises();

            document.getElementById('download-results').click();
            await flushPromises();

            expect(window.alert).not.toHaveBeenCalled();
            expect(mockLink.download).toBe('gemini-results-mock-uuid-1234.zip');
            expect(mockLink.click).toHaveBeenCalled();
        });
    });
});
