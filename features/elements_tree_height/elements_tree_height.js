// Elements Tree Height Feature
// Allows users to customize the height of elements tree rows

window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Elements Tree Height Feature");
  let thisScriptKey = "elements_tree_height";
  /* You can ignore all the stuff on this line, but don't delete! */ console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Get the stored height value from chrome.storage
  chrome.storage.sync.get(["elements_tree_height_value"], function(result) {
    // Default to 32px if no value is stored
    const heightValue = result.elements_tree_height_value || 32;
    
    // Set the CSS variable for the height
    document.documentElement.style.setProperty('--elements-tree-height', `${heightValue}px`);
  });
})();