window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Bulk Branch Delete");
  let thisScriptKey = "bulk_branch_delete";

  /* ------------------------------------------------ */
  /* ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ Don't mess with this  ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ */
  /* ------------------------------------------------ */
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
  /* ------------------------------------------------ */
  /* ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ Don't mess with this  ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ */
  /* ------------------------------------------------ */

    // If your feature needs to run something in the popup, you can inject a script into the "Extension UI world" (the options popup), like this:
    chrome.runtime.sendMessage({
        action: "injectScriptIntoExtensionUIWorld",
        jsFile: "features/bulk_branch_delete/bulk_branch_delete_popup.js",
        cssFile: "features/bulk_branch_delete/bulk_branch_delete.css"
    });

})(); //👈👈 don't delete this, and don't put anything outside of this!!