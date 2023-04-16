document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const typingModeSelect = document.getElementById("typingMode");
  const saveApiKeyButton = document.getElementById("saveApiKey");
  const saveSettingsButton = document.getElementById("saveSettings");

  // Load the saved API key and typing mode
  chrome.storage.sync.get(["apiKey", "typingMode"], (result) => {
    apiKeyInput.value = result.apiKey || "";
    typingModeSelect.value = result.typingMode || "character";
  });

  // Save the API key when the save button is clicked
  saveApiKeyButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value;
    chrome.storage.sync.set({ apiKey }, () => {
      alert("API key saved successfully!");
    });
  });

  // Save the typing mode when the save button is clicked
  saveSettingsButton.addEventListener("click", () => {
    const typingMode = typingModeSelect.value;
    chrome.storage.sync.set({ typingMode }, () => {
      alert("Typing mode saved successfully!");
    });
  });
});
