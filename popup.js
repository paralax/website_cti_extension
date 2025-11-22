document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const apiKeyMessage = document.getElementById('api-key-message');
  let apiKey = null;

  // Check for API key on startup
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKey = result.geminiApiKey;
      mainContent.style.display = 'block';
      apiKeyMessage.style.display = 'none';
      fetchModels(apiKey);
    } else {
      mainContent.style.display = 'none';
      apiKeyMessage.style.display = 'block';
    }
  });

  const modelSelect = document.getElementById('model-select');
  const processPageButton = document.getElementById('process-page');
  const outputDiv = document.getElementById('output');
  const newPromptButton = document.getElementById('new-prompt');
  const newPromptContainer = document.getElementById('new-prompt-container');
  const savePromptButton = document.getElementById('save-prompt');
  const promptNameInput = document.getElementById('prompt-name');
  const promptTextInput = document.getElementById('prompt-text');
  const promptSelect = document.getElementById('prompt-select');
  const captureScreenshotButton = document.getElementById('capture-screenshot');
  const downloadResultsButton = document.getElementById('download-results');

  let screenshotDataUrl = null;
  let sourceCode = null;

  loadPrompts();

  newPromptButton.addEventListener('click', () => {
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
        prompts.push({ name, text });
        chrome.storage.local.set({ prompts }, () => {
          promptNameInput.value = '';
          promptTextInput.value = '';
          newPromptContainer.style.display = 'none';
          loadPrompts();
        });
      });
    }
  });

  function loadPrompts() {
    promptSelect.innerHTML = '';
    chrome.storage.local.get({ prompts: [] }, (result) => {
      result.prompts.forEach(prompt => {
        const option = document.createElement('option');
        option.value = prompt.text;
        option.textContent = prompt.name;
        promptSelect.appendChild(option);
      });
    });
  }

  async function fetchModels(apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Filter for models that support generateContent
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
        const selectedPrompt = promptSelect.value;

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
