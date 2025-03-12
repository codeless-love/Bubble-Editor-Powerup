// Service worker initialization

let debounceTimeouts = {}; // Store timeouts for each tabId

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
    // Return the result from the tab's execution context
    return response[0].result;
  } catch (error) {
    console.error("❤️ Error checking if feature is injected:", error);
    return false; // Default to false in case of an error
  }
}

// Injects enabled features (CSS/JS) into the specified tab
async function injectFeatures(tabId) {
  try {
    // Get the tab URL
    const featuresConfig = await loadFeatures(); // Load the list of all available features
    if (!featuresConfig || featuresConfig.length === 0) {
      console.warn("❤️ No features found to inject");
      return;
    }

    const defaults = Object.fromEntries(featuresConfig.map(f => [f.key, f.default])); // get defaults from the json
    const prefs = await chrome.storage.sync.get(defaults);// Load user preferences from chrome storage

    if (Object.keys(prefs).length === 0) {
      await chrome.storage.sync.set(defaults);
    }

    // reinitialize
    bubbleTabs.set(tabId, new Set()); // Create a new Set to track injected features for this tab
    const injectedFeatures = bubbleTabs.get(tabId); // Get the Set of injected features for this tab

    // Iterate through all features in the configuration
    for (const feature of featuresConfig) {
      const isEnabled = prefs[feature.key] == true; // Check if the feature is enabled in user preferences

      // Inject the feature only if it's enabled and hasn't been injected already
      if (isEnabled && !injectedFeatures.has(feature.key)) {
        // Inject CSS if available
        if (feature.cssFile) {
          try {
            await chrome.scripting.insertCSS({
              target: { tabId }, // Specify the target tab
              files: [feature.cssFile], // CSS file to inject
            });
          } catch (cssError) {
            console.error(`❤️ Error injecting CSS for ${feature.key}:`, cssError);
            // Continue to try JS injection even if CSS fails
          }
        }

        // Inject JS if available
        if (feature.jsFile) {
          const alreadyInjected = await isFeatureInjected(tabId, feature.key);
          if (!alreadyInjected) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: [feature.jsFile],
              });

              // Verify injection was successful
              const featureIsInjected = await isFeatureInjected(tabId, feature.key);
              if (!featureIsInjected) {
                console.warn(`❤️ JS injection for ${feature.key} may not have been successful`);
              }
            } catch (scriptError) {
              console.error(`❤️ Error injecting JS for ${feature.key}:`, scriptError);
              // Continue with other features even if this one fails
            }
          }
        }

        // Mark as injected regardless of success to avoid repeated injection attempts
        injectedFeatures.add(feature.key);
      }
    }
  } catch (error) {
    console.error("❤️ Error in injectFeatures:", error);
  }
}

// Clean up injected features when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  bubbleTabs.delete(tabId); // Remove the tab's entry from the Map
});

// Listen for when a tab is updated (e.g., reloaded, navigated)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

  // Check if the tab has finished loading and is a Bubble editor page
  if (changeInfo.status === "complete" && tab.url &&
      (tab.url.includes("bubble.io") || tab.url.includes("bubble.is"))) {

    // Check if this is a Bubble editor page - only allowing /page paths
    let isBubbleEditor = false;

    try {
      const urlObj = new URL(tab.url);
      // Only permit exact /page paths
      isBubbleEditor = urlObj.pathname === "/page";
    } catch (e) {
      // Use regex check if URL parsing fails
      const regex = /bubble\.(io|is)\/page($|\?)/;
      isBubbleEditor = regex.test(tab.url);
    }

    if (isBubbleEditor) {
      // Clear any existing debounce timeout for the tabId
      if (debounceTimeouts[tabId]) {
        clearTimeout(debounceTimeouts[tabId]);
      }

      // Set a new timeout to trigger the function after 1 second (debouncing)
      debounceTimeouts[tabId] = setTimeout(() => {
        injectFeatures(tabId); // Inject features into the tab
      }, 1000); // 1 second debounce
    }
  }
});

// Listens to a message so that it loads the AppQueryScript for drag-rearrange colors
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectAppQueryScript") {
    chrome.scripting
      .executeScript({
        target: { tabId: sender.tab.id },
        files: ["features/style-drag-rearrange/appquery-scripts.js"],
        world: "MAIN",
      })
      .then(() => {
        console.log("Injected appquery script");
        sendResponse({
          success: true,
          message: "Script injected successfully.",
        });
      })
      .catch((err) => {
        sendResponse({
          success: false,
          message: "Failed to inject script",
          error: err.message,
        });
        console.error("Error injecting script:", err);
      });
    return true;
  }
});
