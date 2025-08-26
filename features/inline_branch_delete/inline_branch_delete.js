window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Inline Branch Delete");
  let thisScriptKey = "inline_branch_delete";
  
  /* ------------------------------------------------ */
  /* ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ Don't mess with this  ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ */
  /* ------------------------------------------------ */
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
  console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);
  /* ------------------------------------------------ */
  /* ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ Don't mess with this  ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ */
  /* ------------------------------------------------ */
    // Run the main script in the main world, you can inject a script into the "main world" (the actual tab context), like this:
    chrome.runtime.sendMessage({
        action: "injectScriptIntoMainWorld",
        jsFile: "features/inline_branch_delete/main_world_inline_branch_delete.js"
    });

})();//👈👈 don't delete this, and don't put anything outside of this!!
