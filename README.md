# Gemini Web Companion Chrome Extension

This Chrome extension allows you to analyze web pages using Google's Gemini API. You can create and store prompts, process the content of the current page, capture a screenshot, and download all the results as a zip archive.

![Extension screenshot, a squid grabbing some laptops.](/assets/website_cti_extension_logo.png)



## Setup

Before you can use the extension, you need to obtain a Gemini API key.

1.  **Get a Gemini API Key:**
    *   Visit [Google AI Studio](https://aistudio.google.com/) to create and manage your API keys.
    *   You may need to create a Google Cloud project if you don't have one already.

2.  **Configure the Extension:**
    *   After installing the extension, open its options page. You can usually do this by right-clicking the extension icon in your browser's toolbar and selecting "Options".
    *   Paste your Gemini API key into the designated field and click "Save".

## Installation (for Development)

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** using the toggle switch in the top-right corner.
3.  Click the **Load unpacked** button.
4.  Select the directory where you have the extension's code.

The extension should now be installed and ready to use.

## Packaging (for Distribution)

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode**.
3.  Click the **Pack extension** button.
4.  In the "Extension root directory" field, select the path to the extension's folder.
5.  (Optional) If you are updating a previously packed extension, you will need to provide the `.pem` private key file that was generated with the first version.
6.  Click the **Pack extension** button.

Chrome will create a `.crx` file, which is the packaged extension, and a `.pem` file, which is your private key. **Keep the `.pem` file safe**, as you will need it to publish updates to your extension.
