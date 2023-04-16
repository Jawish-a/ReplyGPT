/**
 * Retrieves the ChatGPT API key from Chrome storage.
 * @returns {Promise<string>} A Promise that resolves with the API key.
 */
function getChatGPTAPIKey() {
  // Create a Promise that resolves with the API key retrieved from Chrome storage.
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiKey"], (result) => {
      resolve(result.apiKey);
    });
  });
}

/**
 * Generates a chat reply using the ChatGPT API and the specified email content.
 * @param {string} emailContent - The content of the email to generate a reply for.
 * @returns {Promise<string>} A Promise that resolves with the generated chat reply.
 */
async function generateReply(emailContent) {
  // Retrieve the ChatGPT API key from Chrome storage.
  const apiKey = await getChatGPTAPIKey();

  // Ensure the API key is available.
  if (!apiKey) {
    return "Error: No API key found. Please configure the API key in the extension options.";
  }

  // Define the options for the ChatGPT API request.
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-ada-001",
      prompt: `Reply to this email:\n${emailContent}\n\nGenerated reply:`,
      temperature: 0.6,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 1,
      presence_penalty: 1,
    }),
  };

  try {
    // Send a request to the ChatGPT API with the specified options.
    const response = await fetch(
      "https://api.openai.com/v1/completions",
      requestOptions
    );
    const data = await response.json();

    // If a chat reply is generated, return it.
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].text.trim();
    } else {
      // Otherwise, return an error message.
      return "Error: Failed to generate a reply from ChatGPT.";
    }
  } catch (error) {
    // If an error occurs, return an error message that includes the error message.
    return `Error: ${error.message}`;
  }
}

/**
 * Listens for a message from the extension popup to generate a chat reply, and sends the generated reply back to the popup.
 * @param {object} request - The request message sent from the extension popup.
 * @param {object} sender - The sender of the request message.
 * @param {function} sendResponse - The function to call with the generated chat reply.
 * @returns {boolean} Whether to keep the message channel open for the async response.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // If the action in the request is to generate a chat reply, call the `generateReply()` function
  // and send the generated reply back to the popup.
  if (request.action === "generateReply") {
    generateReply(request.emailContent).then((generatedReply) => {
      sendResponse({ generatedReply });
    });

    // Keep the message channel open for the async response.
    return true;
  }
});
