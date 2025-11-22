// This script will be injected into the active tab to extract the page's source code.
// We will implement the logic for this in a future step.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSourceCode') {
    sendResponse({ sourceCode: document.documentElement.outerHTML });
  }
});
