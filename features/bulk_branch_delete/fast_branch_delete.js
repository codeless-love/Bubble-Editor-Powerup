window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Bulk Branch Delete");
  let thisScriptKey = "bulk_branch_delete";

  // Injection prevention check (one-liner, don't modify)
  /* You can ignore all the stuff on this line, but don't delete! */ console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);
  
  // This feature is implemented in the extension popup rather than injected into the page
  // The actual functionality is in popup_fast_branch_delete.js
  // This file exists to maintain consistency with the feature architecture

})(); // IIFE wrapper - don't put code outside
