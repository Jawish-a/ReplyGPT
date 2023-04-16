/**
 * Inserts a ChatGPT reply button next to the specified reply button element.
 * @param {Element} replyButton - The reply button element to insert the ChatGPT button next to.
 */
function insertChatGPTReplyButton(replyButton) {
  // Create the ChatGPT reply button.
  const chatGPTButton = document.createElement("button");
  chatGPTButton.innerHTML = "Reply with ReplyAI";
  chatGPTButton.style.marginLeft = "8px";
  chatGPTButton.style.padding = "4px 8px";
  chatGPTButton.style.backgroundColor = "#ffffff";
  chatGPTButton.style.color = "#4285f4";
  chatGPTButton.style.border = "2px solid #4285f4";
  chatGPTButton.style.borderRadius = "999px";
  chatGPTButton.style.cursor = "pointer";

  // Add an event listener to handle button clicks.
  chatGPTButton.addEventListener("click", () => {
    // Change the button text to indicate loading and disable the button.
    chatGPTButton.innerHTML = "Loading...";
    chatGPTButton.disabled = true;

    // Retrieve the content of the email being viewed in the browser.
    const emailContent = getEmailContent();

    // Request a chat reply using the email content and the user's preferred typing mode.
    requestChatGPTReply(emailContent, (generatedReply) => {
      // Restore the button text and enable the button.
      chatGPTButton.innerHTML = "Reply with ChatGPT";
      chatGPTButton.disabled = false;

      // Retrieve the user's preferred typing mode from the Chrome storage API and insert the generated reply into the chat reply textbox.
      chrome.storage.sync.get(["typingMode"], (result) => {
        const typingMode = result.typingMode || "character";
        insertReplyToTextbox(generatedReply, typingMode);
      });
    });
  });

  // Insert the ChatGPT button next to the reply button.
  replyButton.parentNode.insertBefore(chatGPTButton, replyButton.nextSibling);
}

/**
 * Retrieves the content of the email being viewed in the browser.
 * @returns {string} The content of the email as a string, or an empty string if no email is found.
 */
function getEmailContent() {
  // Attempt to locate the email element in the DOM.
  const emailElement = document.querySelector(".ii.gt"); // You might need to adjust this selector for your specific case

  // If an email element is found, return its inner text content.
  if (emailElement) {
    return emailElement.innerText;
  }

  // Otherwise, return an empty string.
  return "";
}

/**
 * Requests a chat reply from the background script using the email content and typing mode.
 * @param {string} emailContent - The content of the email to generate a reply for.
 * @param {Function} callback - The function to call when the reply is generated.
 */
function requestChatGPTReply(emailContent, callback) {
  // Retrieve the typing mode setting from the Chrome storage API, defaulting to "character".
  chrome.storage.sync.get(["typingMode"], (result) => {
    const typingMode = result.typingMode || "character";

    // Send a message to the background script to generate a chat reply using the email content and typing mode.
    chrome.runtime.sendMessage(
      { action: "generateReply", emailContent, typingMode },
      (response) => {
        // Call the specified callback function with the generated chat reply.
        callback(response.generatedReply);
      }
    );
  });
}

/**
 * Calculates the delay between typing units based on the typing mode.
 * @param {string} typingMode - The mode of typing, either "word" or "character".
 * @returns {number} The delay between typing units in milliseconds.
 */
function getTypingDelay(typingMode) {
  // Define the delay between each character and each word in milliseconds.
  const characterTypingDelay = 50;
  const wordTypingDelay = 150;

  // Return the appropriate typing delay based on the typing mode.
  return typingMode === "word" ? wordTypingDelay : characterTypingDelay;
}

/**
 * Finds the active reply or compose text area in the DOM.
 * @returns {Element|null} The active text area element, or null if none is found.
 */
function getReplyTextbox() {
  // Find the active reply or compose text area element in the DOM.
  const activeTextbox = document.querySelector(
    'div[contenteditable="true"][role="textbox"]'
  );

  // If an active text area element is found, return it.
  if (activeTextbox) {
    return activeTextbox;
  }

  // Otherwise, return null.
  return null;
}

/**
 * Inserts a reply message into the chat reply textbox, simulating typing behavior.
 * @param {string} replyText - The text of the message to be inserted.
 * @param {string} typingMode - The mode of typing, either "word" or "character".
 */
function insertReplyToTextbox(replyText, typingMode) {
  // Attempt to locate the chat reply textbox.
  const replyTextbox = getReplyTextbox();

  if (replyTextbox) {
    // Focus the chat reply textbox.
    replyTextbox.focus();

    // Calculate the delay between typing units based on the typing mode.
    const typingDelay = getTypingDelay(typingMode);

    // Split the reply message into units based on the typing mode.
    const typingUnits =
      typingMode === "word" ? replyText.split(" ") : replyText.split("");
    let typingIndex = 0;

    // Define a recursive function to simulate typing behavior for each unit.
    const typeUnit = () => {
      if (typingIndex < typingUnits.length) {
        // Update the text in the chat reply textbox to include the current unit and a zero-width space character.
        const currentText = replyTextbox.innerText;
        const newText =
          currentText.slice(0, currentText.length - 1) +
          typingUnits[typingIndex] +
          (typingMode === "word" ? " " : "") +
          "\u200B";
        replyTextbox.innerText = newText;
        typingIndex++;

        // Schedule the next typing unit after a delay.
        setTimeout(typeUnit, typingDelay);
      }
    };

    // Begin simulating typing behavior for the reply message.
    typeUnit();
  }
}

// Initialize a MutationObserver that listens for DOM mutations.
const observer = new MutationObserver((mutations) => {
  // For each mutation, check if any nodes were added to the DOM.
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      // Attempt to locate a reply button element on the page.
      const replyButton = document.querySelector(
        'div[role="button"][data-tooltip="Reply"]'
      );

      // If a reply button element is found and it has not already been initialized,
      // add a custom CSS class to it and insert a chat reply button after it.
      if (
        replyButton &&
        !replyButton.classList.contains("chatgpt-initialized")
      ) {
        replyButton.classList.add("chatgpt-initialized");
        insertChatGPTReplyButton(replyButton);
      }
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
