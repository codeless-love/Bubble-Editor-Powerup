window.loadedCodelessLoveScripts ||= {};
(function () {
  console.log("❤️" + "Delete unused colors");
  let thisScriptKey = "delete_unused_colors";

  /* ------------------------------------------------ */
  /* ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ Don't mess with this  ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ */
  /* ------------------------------------------------ */
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn(
      "❤️" +
        thisScriptKey +
        " tried to load, but it's value is already " +
        window.loadedCodelessLoveScripts[thisScriptKey],
    );
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
  /* ------------------------------------------------ */
  /* ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ Don't mess with this  ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ */
  /* ------------------------------------------------ */

  chrome.runtime.sendMessage({
    action: "injectScriptIntoExtensionUIWorld",
    jsFile: "features/delete_unused_colors/delete_unused_colors_popup.js",
    cssFile: "features/delete_unused_colors/delete_unused_colors.css",
  });
})();
