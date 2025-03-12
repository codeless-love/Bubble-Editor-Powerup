window.loadedCodelessLoveScripts ||= {};

(function () {
  let thisScriptKey = "style_drag_rearrange";
  /* You can ignore all the stuff on this line, but don't delete! */
  // console.log("❤️" + window.loadedCodelessLoveScripts[thisScriptKey]);
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn(
      "❤️" +
        thisScriptKey +
        " tried to load, but it's value is already " +
        window.loadedCodelessLoveScripts[thisScriptKey]
    );
    return;
  }

  /* ------------------------------------------------------------------- */
  // INSTRUCTIONS
  //
  // 1. If your feature is CSS only, delete this file.
  // 2. Replace the example text with the name of your feature on line 3 of this file.
  // 3. Replace the example key with your feature's script (snake_case preferred) on line 4 of this file.
  // 4. Insert any Javascript here. Don't put anything after the })(); at the end.
  /* ------------------------------------------------------------------- */

  chrome.runtime.sendMessage({ action: "injectAppQueryScript" }, (response) => {
    if (response && response.success) {
      window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
      console.log("❤️" + "Drag to rearrange colors and fonts loaded");
    } else {
      console.error(
        "❌ Script injection failed:",
        response?.message || "No response received"
      );
    }
  });

  // Mark this script as loaded

  /*Exit if already loaded*/
  // window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
})(); //👈👈 don't delete this, and don't put anything outside of this!!
