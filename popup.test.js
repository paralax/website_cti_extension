/**
 * @jest-environment jsdom
 */

require('./__mocks__/chrome');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './popup.html'), 'utf8');

describe('popup.js', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = html.toString();
    jest.resetModules(); // This is crucial to re-run the script content
    jest.clearAllMocks();
  });

  describe('prompt management', () => {
    it('should load prompts from storage on DOMContentLoaded', () => {
      // Setup the listener by requiring the script
      require('./popup.js');
      // Fire the event
      document.dispatchEvent(new Event('DOMContentLoaded'));
      // Check that the storage was called
      expect(chrome.storage.local.get).toHaveBeenCalledWith({ prompts: [] }, expect.any(Function));
    });

    it('should save a new prompt to storage when save button is clicked', () => {
      // Setup the listener
      require('./popup.js');
      // Fire the event to attach click handlers
      document.dispatchEvent(new Event('DOMContentLoaded'));

      const promptNameInput = document.getElementById('prompt-name');
      const promptTextInput = document.getElementById('prompt-text');
      const savePromptButton = document.getElementById('save-prompt');

      // Simulate user input
      promptNameInput.value = 'Test Prompt';
      promptTextInput.value = 'This is a test prompt.';

      // Simulate click
      savePromptButton.click();

      // The save handler first GETS the existing prompts
      expect(chrome.storage.local.get).toHaveBeenCalled();

      // Then it SETS the new list of prompts
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { prompts: [{ name: 'Test Prompt', text: 'This is a test prompt.' }] },
        expect.any(Function)
      );
    });
  });
});
