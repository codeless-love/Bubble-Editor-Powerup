/* */ window.loadedCodelessLoveScripts ||= {};
/* */(function() {

const featureKey = "elements_tree_height";// Replace this with your feature's  key (same as what's in features.json)
console.log("❤️"+"Elements Tree Height Feature");// Replace this with your feature's name

/* */   if (window.loadedCodelessLoveScripts[featureKey] === "loaded") {console.warn("❤️ Feature already loaded:", featureKey);return;}
/* */   window.loadedCodelessLoveScripts[featureKey] = "loaded";
/* */   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
/* */     if (message.action === "runScript") {
/* */       console.log("❤️ Loaded feature ", message.featureKey);

// Get the stored height value from chrome.storage
chrome.storage.sync.get(["elements_tree_height_value"], function(result) {
  // Default to 32px if no value is stored
  const heightValue = result.elements_tree_height_value || 32;

  // Set the CSS variable for the height
  document.documentElement.style.setProperty('--elements-tree-height', `${heightValue}px`);
});

// After all tasks are done, send the response
sendResponse({ success: true });

/* */       return true;  // Asynchronous response
/* */     }
/* */   });
/* */ })();
