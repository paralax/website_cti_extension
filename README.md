# Gemini Web Companion Chrome Extension

This Chrome extension allows you to analyze web pages using Google's Gemini API. You can create and store prompts, process the content of the current page, capture a screenshot, and download all the results as a zip archive.

## Setup

Before you can use the extension, you need to configure your own Google Cloud project and obtain an OAuth 2.0 Client ID.

1.  **Create a Google Cloud Project:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project.
    *   Enable the **Generative Language API** for your project.

2.  **Create an OAuth 2.0 Client ID:**
    *   In the Google Cloud Console, navigate to **APIs & Services > Credentials**.
    *   Click **Create Credentials > OAuth client ID**.
    *   Choose **Chrome App** as the application type.
    *   Enter the **Application ID**, which you can find by following these steps:
        1.  Go to `chrome://extensions` in your Chrome browser.
        2.  Enable **Developer mode**.
        3.  Click **Load unpacked** and select the directory containing this extension's code.
        4.  The ID of the loaded extension is your Application ID.
    *   Click **Create**.

3.  **Update the `manifest.json` file:**
    *   Open the `manifest.json` file in the extension's directory.
    *   Replace the placeholder value for `client_id` with the Client ID you just created.

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
