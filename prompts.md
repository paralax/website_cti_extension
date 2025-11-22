# prompts

## initial prompt

Develop a Chrome extension that does the following:
- can authenticate to Google Gemini
- can create and store one or more Gemini prompts
- can be invoked while visiting a website by the user to do the following:
  - read the contents of the page
  - sumit the web page source code and a stored Gemini prompt to process that website using Gemini; allow the user to choose the version of Gemini to use, e.g. Gemini 2.5 Pro, 2.5 Flash, etc, by calling the right API to get the list of currently available Google Gemini versions 
  - present the user with the output of the web page after processing with the Gemini prompt 
  - allow the user capture a screenshot of the web page the user is visiting
  - present the user with feature that lets them download the web page source HTML together with the source URL and the current timestamp, the screenshot they made using the extension, and the results of running the Gemini prompt
