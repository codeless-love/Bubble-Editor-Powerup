// Service worker initialization
console.log("❤️ Loaded background.js");

/* Load Features */

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
      prefs = await chrome.storage.sync.get(defaults); // Ensure updated prefs are loaded
    }

    const injectedFeatures = new Set(); // Track injected features for this tab

    for (const feature of featuresConfig) {
      const isEnabled = prefs[feature.key] == true; // Check if the feature is enabled
      if (isEnabled && !injectedFeatures.has(feature.key)) {
        // Inject CSS if available
        if (feature.cssFile) {
          await chrome.scripting.insertCSS({ target: { tabId }, files: [feature.cssFile] });
        }

        // Inject JS dynamically
        if (feature.jsFile) {
          const alreadyInjected = await isFeatureInjected(tabId, feature.key);
          if (!alreadyInjected) {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: [feature.jsFile],
            }).then(() => {
              console.log(`❤️ Running JS for ${feature.key}`);
              injectedFeatures.add(feature.key); // Mark feature as injected

              // Send message to tell the content script to run after JS is injected. In the future we can use this to run scripts dynamically.
              chrome.tabs.sendMessage(tabId, {
                action: "runScript",
                jsFile: feature.jsFile,
                featureKey: feature.key,
              });
            }).catch((error) => {
                console.error(`❤️ Failed to inject JS for ${feature.key}:`, error);
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

/* Facilitate feature's injecting their own scripts into the main world */

// When a feature's script needs to inject a script directly into the tab's context (the "main world"), it will send a message 'injectScriptFromFeature' via sendMessage, which will be picked up with this file's addListener below, which will execute this function to inject the passed file path.
function injectScriptFromFeatureContentScript(url) {
  return () => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(url);
    script.type = 'text/javascript';
    document.documentElement.appendChild(script);
    script.onload = () => script.remove();
  };
}

/* Message Listeners */

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("bubble.io")) {
    // Ensure the content script is loaded correctly
    chrome.scripting.executeScript({
      target: { tabId },
      func: injectScriptFromFeatureContentScript, // this function is correctly defined here
      args: [message.jsFile], // Pass the necessary arguments to the content script
    }).catch((error) => console.error("❤️ Error loading content script injector:", error));

    // Debouncing injection of features
    clearTimeout(debounceTimeouts[tabId]);
    debounceTimeouts[tabId] = setTimeout(() => injectFeatures(tabId), 1000);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectScriptIntoMainWorld") {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id }, // Correctly use sender.tab.id here
      func: injectScriptFromFeatureContentScript,
      args: [message.jsFile],
    }).catch((error) => console.error("❤️ Error injecting script:", error));
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clear any pending timeouts
  if (debounceTimeouts[tabId]) {
    clearTimeout(debounceTimeouts[tabId]);
    delete debounceTimeouts[tabId];
  }
  
  // Clear injection progress flag
  injectionInProgress.delete(tabId);
  
  // Notify content scripts to clean up
  try {
    chrome.tabs.sendMessage(tabId, { action: "cleanup" });
  } catch (e) {
    // Tab might be already closed, ignore errors
  }
});
