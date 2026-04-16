window.loadedCodelessLoveScripts ||= {};
(function() {
  const thisScriptKey = "expression_arbitrary_text_display";

  if (window.loadedCodelessLoveScripts[thisScriptKey]) {
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = true;

  chrome.runtime.sendMessage({
    action: "injectScriptIntoMainWorld",
    jsFile: "features/expression_arbitrary_text_display/main_world_expression_arbitrary_text_display.js"
  });
})();
