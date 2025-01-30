
let debounceTimeouts = {}; // Store timeouts for each tabId

// Load features dynamically from a JSON file
async function loadFeatures() {
  const response = await fetch(chrome.runtime.getURL("features.json")); // Fetch the features configuration file
  return response.json(); // Return the parsed JSON
}

// Store injected features by tabId using a Map
// Map key: tabId, value: Set of feature keys already injected
const bubbleTabs = new Map();

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
    });
    console.log("❤️"+featureKey + " status: " + response[0].result);
    // Return the result from the tab's execution context
    return response[0].result;
  } catch (error) {
    console.error("❤️"+"Error checking if feature is injected:", error);
    return false; // Default to false in case of an error
  }
}

// Injects enabled features (CSS/JS) into the specified tab
async function injectFeatures(tabId) {
  const featuresConfig = await loadFeatures(); // Load the list of all available features
  const defaults = Object.fromEntries(featuresConfig.map(f => [f.key, f.default])); // get defaults from the json
  const prefs = await chrome.storage.sync.get(defaults);// Load user preferences from chrome storage
  if (Object.keys(prefs).length === 0) {
    await chrome.storage.sync.set(defaults);
  }

  // renitialize
  bubbleTabs.set(tabId, new Set()); // Create a new Set to track injected features for this tab
  const injectedFeatures = bubbleTabs.get(tabId); // Get the Set of injected features for this tab

  // Iterate through all features in the configuration
  for (const feature of featuresConfig) {
    const isEnabled = prefs[feature.key] !== false; // Check if the feature is enabled in user preferences

    // Inject the feature only if it's enabled and hasn't been injected already
    if (isEnabled) {
      if(!injectedFeatures.has(feature.key)) {
        try {
          if (feature.cssFile) {
            // Inject the CSS file into the tab
            await chrome.scripting.insertCSS({
              target: { tabId }, // Specify the target tab
              files: [feature.cssFile], // CSS file to inject
            });
          }
          if (feature.jsFile) {
            let alreadyInjected = await isFeatureInjected(tabId, feature.key);
            if (alreadyInjected) {
             console.log("❤️"+`Feature '${feature.key}' was already injected.`);
            } else {
             console.log("❤️"+`Injecting feature '${feature.key}'`);
             await chrome.scripting.executeScript({
               target: { tabId },
               files: [feature.jsFile],
             });
            }
          }
          injectedFeatures.add(feature.key); // Mark the feature as injected in the Set
        } catch (error) {
          console.error("❤️"+`Failed to inject feature '${feature.key}' on tab ${tabId}:`, error); // Log errors during injection
        }
      } else {
        console.warn("❤️"+feature.key + " already injected into this tab on this load.");
      }
    }// else {
    //   console.log("❤️"+"Skipping feature: " + feature.key);
    // }
  }
}

// Clean up injected features when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  bubbleTabs.delete(tabId); // Remove the tab's entry from the Map
});

// Listen for when a tab is updated (e.g., reloaded, navigated)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab has finished loading and is a Bubble.io editor page
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("bubble.io/page")) {
    // Clear any existing debounce timeout for the tabId
    if (debounceTimeouts[tabId]) {
      clearTimeout(debounceTimeouts[tabId]);
    }
    // Set a new timeout to trigger the function after 1 second (debouncing)
    debounceTimeouts[tabId] = setTimeout(() => {
      console.log("❤️"+"Reload tab '" + tabId + "' --------------------------------------");
      injectFeatures(tabId); // Inject features into the tab
    }, 1000); // 1 second debounce
  }
});
