window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️ Enter Debug Mode feature loaded");
  let thisScriptKey = "runtime_enter_debug";

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

  // Only activate if debug_mode=true is not in the URL
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug_mode") === "true") {
    return;
  }

  // Inject a script into the "Extension UI world" (the options popup)
  chrome.runtime.sendMessage({
      action: "injectScriptIntoExtensionUIWorld",
      jsFile: "features/runtime_enter_debug/options_script.js",
  });

  
})(); //👈👈 don't delete this, and don't put anything outside of this!!








