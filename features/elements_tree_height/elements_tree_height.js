// Elements Tree Height Feature
// Allows users to customize the height of elements tree rows

(function() {
  // Mark this script as loaded to prevent duplicate injections
  if (!window.loadedCodelessLoveScripts) {
    window.loadedCodelessLoveScripts = {};
  }
  window.loadedCodelessLoveScripts["elements_tree_height"] = "loaded";

  // Get the stored height value from chrome.storage
  chrome.storage.sync.get(["elements_tree_height_value"], function(result) {
    // Default to 32px if no value is stored
    const heightValue = result.elements_tree_height_value || 32;
    
    // Set the CSS variable for the height
    document.documentElement.style.setProperty('--elements-tree-height', `${heightValue}px`);
  });
})();