window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Name of feature goes here");
  let thisScriptKey = "example_feature";

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

  /* ------------------------------------------------------------------- */
  // INSTRUCTIONS
  //
  // 1. If your feature is CSS only, delete this file.
  // 2. Replace the example text on line 3 with the name of your feature on line 3 of this file.
  // 3. Replace the example key on line 4 with your feature's script (snake_case preferred) on line 4 of this file.
  // 4. Insert any Javascript for your feature here in this file (example line 30). Don't put anything after the })(); at the end.
  // 5. Delete the "main world" injection demo code on lines 32-36, and delete the example script as well.
  /* ------------------------------------------------------------------- */

    // This is the isolated content script context. This is the ideal place to run all your feature scripts. Even though this content script is "isolated", it still has access to the page's DOM. However, it can't run JavaScript that is running in the main world (the page's context).
    console.log("❤️ This executes in the context of the feature script!;")
    
    // In the very rare event that you MUST run JavaScript in the main world, you can inject a script into the "main world" (the actual tab context), like this:
    chrome.runtime.sendMessage({
        action: "injectScriptIntoMainWorld",
        jsFile: "features/example_feature/example_script_that_must_execute_in_the_main_world.js"
    });

    // If your feature needs to run something in the popup, you can inject a script into the "Extension UI world" (the options popup), like this:
    chrome.runtime.sendMessage({
        action: "injectScriptIntoExtensionUIWorld",
        jsFile: "features/example_feature/example_script_that_must_execute_in_the_extension_ui_world.js",
        cssFile: "features/example_feature/example_style_that_must_load_in_the_extension_ui_world.css"
    });

})();//👈👈 don't delete this, and don't put anything outside of this!!
