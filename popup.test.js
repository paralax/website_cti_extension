/**
 * @jest-environment jsdom
 */

require('./__mocks__/chrome');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './popup.html'), 'utf8');

// Mock fetch
global.fetch = jest.fn();

describe('popup.js', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = html.toString();
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('API Key Management', () => {
    it('should show the API key message if the key is not set', () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (Array.isArray(keys) && keys.includes('geminiApiKey')) {
          callback({}); // No API key
        } else if (typeof keys === 'object' && 'prompts' in keys) {
          callback({ prompts: [] }); // Prompts are still loaded
        }
      });

      require('./popup.js');
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const apiKeyMessage = document.getElementById('api-key-message');
      const mainContent = document.getElementById('main-content');

      expect(apiKeyMessage.style.display).toBe('block');
      expect(mainContent.style.display).toBe('none');
    });

    it('should show the main content if the API key is set', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (Array.isArray(keys) && keys.includes('geminiApiKey')) {
          callback({ geminiApiKey: 'test-api-key' });
        } else if (typeof keys === 'object' && 'prompts' in keys) {
          callback({ prompts: [] });
        }
      });

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ models: [{ name: 'models/gemini-pro', displayName: 'Gemini Pro', supportedGenerationMethods: ['generateContent']}] }),
      });

      require('./popup.js');
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 0));

      const apiKeyMessage = document.getElementById('api-key-message');
      const mainContent = document.getElementById('main-content');

      expect(apiKeyMessage.style.display).toBe('none');
      expect(mainContent.style.display).toBe('block');
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models?key=test-api-key'));
    });

    it('should show an error if fetching models fails', async () => {
        chrome.storage.local.get.mockImplementation((keys, callback) => {
          if (Array.isArray(keys) && keys.includes('geminiApiKey')) {
            callback({ geminiApiKey: 'test-api-key' });
          } else if (typeof keys === 'object' && 'prompts' in keys) {
            callback({ prompts: [] });
          }
        });

        global.fetch.mockRejectedValue(new Error('Network error'));

        require('./popup.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await new Promise(resolve => setTimeout(resolve, 0));

        const outputDiv = document.getElementById('output');
        expect(outputDiv.textContent).toBe('Error fetching models. Is your API key valid?');
    });
  });

  describe('prompt management', () => {
    beforeEach(() => {
        // Mock a successful fetch for models to allow main content to load
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ models: [{ name: 'models/gemini-pro', displayName: 'Gemini Pro', supportedGenerationMethods: ['generateContent']}] }),
        });
    });

    it('should load prompts from storage on DOMContentLoaded', async () => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (Array.isArray(keys) && keys.includes('geminiApiKey')) {
          callback({ geminiApiKey: 'test-api-key' });
        } else if (typeof keys === 'object' && 'prompts' in keys) {
          callback({ prompts: [{ name: 'Loaded Prompt', text: 'Loaded text' }] });
        }
      });

      require('./popup.js');
      document.dispatchEvent(new Event('DOMContentLoaded'));
      await new Promise(resolve => setTimeout(resolve, 0));

      const promptSelect = document.getElementById('prompt-select');
      expect(promptSelect.options.length).toBe(1);
      expect(promptSelect.options[0].text).toBe('Loaded Prompt');
    });

    it('should save a new prompt to storage when save button is clicked', async () => {
        chrome.storage.local.get.mockImplementation((keys, callback) => {
            if (Array.isArray(keys) && keys.includes('geminiApiKey')) {
                callback({ geminiApiKey: 'test-api-key' });
            } else if (typeof keys === 'object' && 'prompts' in keys) {
                callback({ prompts: [] });
            }
        });

        require('./popup.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await new Promise(resolve => setTimeout(resolve, 0));

        const promptNameInput = document.getElementById('prompt-name');
        const promptTextInput = document.getElementById('prompt-text');
        const savePromptButton = document.getElementById('save-prompt');

        promptNameInput.value = 'Test Prompt';
        promptTextInput.value = 'This is a test prompt.';

        savePromptButton.click();

        expect(chrome.storage.local.set).toHaveBeenCalledWith(
            { prompts: [{ name: 'Test Prompt', text: 'This is a test prompt.' }] },
            expect.any(Function)
        );
    });
  });
});
