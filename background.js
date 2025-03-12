// Service worker initialization
console.log("❤️ Loaded background.js");

let debounceTimeouts = {}; // Store timeouts for each tabId
let injectionInProgress = new Set(); // Track which tabId has ongoing injection process

// Load features dynamically from a JSON file
async function loadFeatures() {
  try {
    const response = await fetch(chrome.runtime.getURL("features.json")); // Fetch the features configuration file
    return response.json(); // Return the parsed JSON
  } catch (error) {
    console.error("❤️ Error loading features:", error);
    return []; // Return empty array to prevent further errors
  }
}


// check if a feature script has already been injected
async function isFeatureInjected(tabId, featureKey) {
  try {
    let response = await chrome.scripting.executeScript({
      target: { tabId },
      func: (key) => {
        // Check if the global object and the specific feature key exist
        return (
          typeof window.loadedCodelessLoveScripts !== "undefined" &&
          window.loadedCodelessLoveScripts[key] === "loaded"
        );
      },
      args: [featureKey], // Pass the feature key to the tab context
      args: [featureKey],
    });
    // Return the result from the tab's execution context
    return response[0].result;
  } catch (error) {
    console.error("❤️ Error checking if feature is injected:", error);
    return false; // Default to false in case of an error
  }
}

// Injects enabled features (CSS/JS) into the specified tab
async function injectFeatures(tabId) {
if (injectionInProgress.has(tabId)) {
  console.log(`❤️ Injection already in progress for tabId ${tabId}, skipping.`);
  return; // Skip injection if it's already in progress
}

injectionInProgress.add(tabId); // Mark injection as in progress for this tab

console.log("❤️ Starting feature injection for tabId:", tabId);
try {
  const featuresConfig = await loadFeatures(); // Load the list of all available features
  if (!featuresConfig || featuresConfig.length === 0) {
    console.warn("❤️ No features found to inject");
    injectionInProgress.delete(tabId); // Reset the flag
    return;
  }

  const defaults = Object.fromEntries(featuresConfig.map(f => [f.key, f.default])); // Get defaults from the JSON
  const prefs = await chrome.storage.sync.get(defaults); // Load user preferences

  if (Object.keys(prefs).length === 0) {
    await chrome.storage.sync.set(defaults);
  }

  const injectedFeatures = new Set(); // Track injected features for this tab

  for (const feature of featuresConfig) {
    const isEnabled = prefs[feature.key] == true; // Check if the feature is enabled
    if (isEnabled && !injectedFeatures.has(feature.key)) {
      // Inject CSS if available
      if (feature.cssFile) {
        chrome.scripting.insertCSS({ target: { tabId }, files: [feature.cssFile] });
      }

      // Inject JS dynamically
      if (feature.jsFile) {
        const alreadyInjected = await isFeatureInjected(tabId, feature.key);
        if (!alreadyInjected) {
          chrome.scripting.executeScript({
            target: { tabId },
            files: [feature.jsFile],
          }).then(() => {
            console.log(`❤️ Injected JS for ${feature.key}`);
            injectedFeatures.add(feature.key); // Mark feature as injected

            // Send message to content script after JS is injected
            chrome.tabs.sendMessage(tabId, {
              action: "loadScript",
              jsFile: feature.jsFile,
              featureKey: feature.key,
            });
          });
        }
      }
    }
  }
} catch (error) {
  console.error("❤️ Error in injectFeatures:", error);
} finally {
  injectionInProgress.delete(tabId); // Reset the flag when done
}
}

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("bubble.io")) {
    clearTimeout(debounceTimeouts[tabId]);
    debounceTimeouts[tabId] = setTimeout(() => injectFeatures(tabId), 1000);
  }
});
