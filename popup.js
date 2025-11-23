document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const apiKeyMessage = document.getElementById('api-key-message');
  const apiKeySelect = document.getElementById('api-key-select');
  const modelSelect = document.getElementById('model-select');
  const processPageButton = document.getElementById('process-page');
  const outputDiv = document.getElementById('output');
  const newPromptButton = document.getElementById('new-prompt');
  const newPromptContainer = document.getElementById('new-prompt-container');
  const savePromptButton = document.getElementById('save-prompt');
  const promptNameInput = document.getElementById('prompt-name');
  const promptTextInput = document.getElementById('prompt-text');
  const promptSelect = document.getElementById('prompt-select');
  const editPromptButton = document.getElementById('edit-prompt');
  const deletePromptButton = document.getElementById('delete-prompt');
  const cancelPromptButton = document.getElementById('cancel-prompt');
  const captureScreenshotButton = document.getElementById('capture-screenshot');
  const downloadResultsButton = document.getElementById('download-results');

  // Load API keys and check for existence
  loadApiKeys();

  apiKeySelect.addEventListener('change', () => {
      fetchModels(apiKeySelect.value);
  });

  let screenshotDataUrl = null;
  let sourceCode = null;
  let editingPromptIndex = null;

  loadPrompts();

  function loadApiKeys() {
      chrome.storage.local.get({ geminiApiKeys: [] }, (result) => {
          const keys = result.geminiApiKeys;
          if (keys && keys.length > 0) {
              mainContent.style.display = 'block';
              apiKeyMessage.style.display = 'none';
              apiKeySelect.innerHTML = '';
              keys.forEach((key, index) => {
                  const option = document.createElement('option');
                  option.value = key.key;
                  option.textContent = key.name;
                  apiKeySelect.appendChild(option);
              });
              fetchModels(keys[0].key);
          } else {
              mainContent.style.display = 'none';
              apiKeyMessage.style.display = 'block';
          }
      });
  }

  newPromptButton.addEventListener('click', () => {
    editingPromptIndex = null;
    promptNameInput.value = '';
    promptTextInput.value = '';
    savePromptButton.textContent = 'Save Prompt';
    newPromptContainer.style.display = 'block';
  });

  captureScreenshotButton.addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      screenshotDataUrl = dataUrl;
      console.log('Screenshot captured');
    });
  });

  downloadResultsButton.addEventListener('click', () => {
    if (!sourceCode) {
      alert("Please process the page first to get the source code.");
      return;
    }
    const zip = new JSZip();
    zip.file("source.html", sourceCode);
    zip.file("output.txt", outputDiv.textContent);
    if (screenshotDataUrl) {
      zip.file("screenshot.png", screenshotDataUrl.split(',')[1], { base64: true });
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0].url;
      const timestamp = new Date().toISOString();
      zip.file("metadata.txt", `URL: ${url}\nTimestamp: ${timestamp}`);
      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        const uuid = crypto.randomUUID();
        link.download = `gemini-results-${uuid}.zip`;
        link.click();
      });
    });
  });

  savePromptButton.addEventListener('click', () => {
    const name = promptNameInput.value;
    const text = promptTextInput.value;
    if (name && text) {
      chrome.storage.local.get({ prompts: [] }, (result) => {
        const prompts = result.prompts;
        if (editingPromptIndex !== null) {
          prompts[editingPromptIndex] = { name, text };
        } else {
          prompts.push({ name, text });
        }
        chrome.storage.local.set({ prompts }, () => {
          promptNameInput.value = '';
          promptTextInput.value = '';
          newPromptContainer.style.display = 'none';
          savePromptButton.textContent = 'Save Prompt';
          editingPromptIndex = null;
          loadPrompts();
        });
      });
    }
  });

  function loadPrompts() {
    promptSelect.innerHTML = '';
    chrome.storage.local.get({ prompts: [] }, (result) => {
      result.prompts.forEach((prompt, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = prompt.name;
        promptSelect.appendChild(option);
      });
    });
  }

  editPromptButton.addEventListener('click', () => {
    const selectedIndex = promptSelect.value;
    if (selectedIndex === '' || selectedIndex === null) {
      alert('Please select a prompt to edit.');
      return;
    }

    chrome.storage.local.get({ prompts: [] }, (result) => {
      const prompt = result.prompts[selectedIndex];
      promptNameInput.value = prompt.name;
      promptTextInput.value = prompt.text;
      savePromptButton.textContent = 'Update Prompt';
      editingPromptIndex = selectedIndex;
      newPromptContainer.style.display = 'block';
    });
  });

  deletePromptButton.addEventListener('click', () => {
    const selectedIndex = promptSelect.value;
    if (selectedIndex === '' || selectedIndex === null) {
      alert('Please select a prompt to delete.');
      return;
    }

    if (confirm('Are you sure you want to delete this prompt?')) {
      chrome.storage.local.get({ prompts: [] }, (result) => {
        let prompts = result.prompts;
        prompts.splice(selectedIndex, 1);
        chrome.storage.local.set({ prompts }, () => {
          loadPrompts();
        });
      });
    }
  });

  cancelPromptButton.addEventListener('click', () => {
    newPromptContainer.style.display = 'none';
    promptNameInput.value = '';
    promptTextInput.value = '';
    savePromptButton.textContent = 'Save Prompt';
    editingPromptIndex = null;
  });

  async function fetchModels(apiKey) {
    if (!apiKey) return;
    try {
        modelSelect.innerHTML = '';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const filteredModels = data.models.filter(model =>
        model.supportedGenerationMethods.includes("generateContent")
      );

      filteredModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = model.displayName;
        modelSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error fetching models:', error);
      outputDiv.textContent = 'Error fetching models. Is your API key valid?';
    }
  }

  processPageButton.addEventListener('click', () => {
    const apiKey = apiKeySelect.value;
    if (!apiKey) {
        outputDiv.textContent = 'API key not set. Please set it in the options page.';
        return;
    }

    outputDiv.textContent = 'Processing...';
    processPageButton.disabled = true;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getSourceCode' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          outputDiv.textContent = 'Error: Could not get source code from the page. Try reloading the page.';
          processPageButton.disabled = false;
          return;
        }
        sourceCode = response.sourceCode;
        const selectedModel = modelSelect.value;
        const selectedPromptIndex = promptSelect.value;

        if (selectedPromptIndex === '' || selectedPromptIndex === null) {
            outputDiv.textContent = 'Please select a prompt.';
            processPageButton.disabled = false;
            return;
        }

        const prompts = await new Promise(resolve => {
            chrome.storage.local.get({ prompts: [] }, result => resolve(result.prompts));
        });
        const selectedPrompt = prompts[selectedPromptIndex].text;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                "contents": [{
                  "parts": [
                    { "text": selectedPrompt },
                    { "text": sourceCode }
                  ]
                }]
              })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
              outputDiv.textContent = data.candidates[0].content.parts[0].text;
            } else {
              outputDiv.textContent = 'No response from Gemini.';
            }
          } catch (error) {
            console.error('Error processing page:', error);
            outputDiv.textContent = `Error: ${error.message}`;
          } finally {
            processPageButton.disabled = false;
          }
      });
    });
  });
});
