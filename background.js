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

    // Check for any missing keys and set their defaults
    const missingDefaults = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (!(key in prefs)) {
        missingDefaults[key] = defaultValue;
      }
    }
    
    if (Object.keys(missingDefaults).length > 0) {
      await chrome.storage.sync.set(missingDefaults);
      Object.assign(prefs, missingDefaults);
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
              chrome.tabs.get(tabId).then(tab => 
                console.error('❤️ Injection failed on URL:', tab.url)
              );
              // Add detailed error logging
              console.error(`❤️ Error details:`, {
                message: scriptError.message,
                stack: scriptError.stack,
                tabId: tabId,
                featureFile: feature.jsFile,
                // Get current tab URL
                currentTab: await chrome.tabs.get(tabId).then(tab => ({
                  url: tab.url,
                  status: tab.status
                })).catch(e => `Failed to get tab: ${e.message}`),
                // Check if we have host permission
                hasHostPermission: await chrome.permissions.contains({
                  origins: [`https://*.bubble.io/*`]
                }).catch(e => `Failed to check permissions: ${e.message}`)
              });
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

/* Facilitate feature's injecting their own scripts into the main world */

/* Listen to feature scripts for a command to inject code into the page */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectScriptIntoMainWorld") {
    // First check if the tab is ready
    chrome.tabs.get(sender.tab.id, (tab) => {
      if (chrome.runtime.lastError || !tab.status || tab.status !== "complete") {
        console.warn("❤️ Tab not ready for script injection, waiting for load");
        // Wait for tab to be ready
        chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
          if (updatedTabId === sender.tab.id && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            injectScriptIntoMainWorld(sender.tab.id, message.jsFile)
              .then(result => sendResponse(result))
              .catch(error => sendResponse({ error: error.message }));
          }
        });
      } else {
        // Tab is ready, inject immediately
        injectScriptIntoMainWorld(sender.tab.id, message.jsFile)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ error: error.message }));
      }
    });
    return true; // Keep message channel open for async response
  }
});

// Injects a script directly into the tab's context (the "main world")
function injectScriptIntoMainWorld(tabId, url) {
  console.log("❤️ Injecting the script " + url);
  const fullScriptUrl = chrome.runtime.getURL(url);
  
  // First fetch the script content
  return fetch(fullScriptUrl)
    .then(response => response.text())
    .then(scriptContent => {
      // Then execute it in the page context
      return chrome.scripting.executeScript({
        target: { tabId },
        world: "MAIN", // Explicitly specify main world
        func: (code) => {
          // Create a blob URL from the code
          const blob = new Blob([code], { type: 'text/javascript' });
          const scriptUrl = URL.createObjectURL(blob);
          
          const script = document.createElement('script');
          script.src = scriptUrl;  // Use blob URL instead of inline script
          script.type = 'text/javascript';
          script.className = '❤️injected-script';
          
          // Clean up the blob URL after the script loads
          script.onload = () => URL.revokeObjectURL(scriptUrl);
          
          document.documentElement.appendChild(script);
          return 'injected successfully';
        },
        args: [scriptContent]  // Pass the actual script content
      });
    })
    .then(([result]) => {
      console.log(`❤️ Script ${url} injection result:`, result.result);
      return result.result;
    })
    .catch((error) => {
      console.error("❤️ Error injecting script:", error);
      throw error;
    });
}

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  // Clear any pending timeouts
  if (debounceTimeouts[tabId]) {
    clearTimeout(debounceTimeouts[tabId]);
    delete debounceTimeouts[tabId];
  }
  
  // Notify content scripts to clean up
  chrome.tabs.sendMessage(tabId, { action: "cleanup" }).catch(() => {
    // Ignore errors - tab is likely already closed
  });
});
