document.addEventListener('DOMContentLoaded', () => {
  const saveButton = document.getElementById('save');
  const apiKeyInput = document.getElementById('api-key');
  const statusDiv = document.getElementById('status');

  // Load the saved API key
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  saveButton.addEventListener('click', () => {
    const apiKey = apiKeyInput.value;
    chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
      statusDiv.textContent = 'API key saved.';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    });
  });
});
