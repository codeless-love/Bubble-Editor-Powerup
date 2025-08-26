window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️Enable Runtime Features");
  let thisScriptKey = "runtime_enable";

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

    chrome.runtime.sendMessage({
        action: "injectScriptIntoMainWorld",
        jsFile: "features/runtime_enable/get_app_info.js"
    });

    // Listen for messages from the main world
    window.addEventListener('message', (event) => {
      if (
        event.source === window &&
        event.data &&
        event.data.source === 'main-world-script' &&
        event.data.action === 'appDomainResult'
      ) {
        const domain = event.data.payload?.domain;
        if (domain) {
          chrome.storage.sync.get({ candidateDomains: [] }, (result) => {
            const candidateDomains = result.candidateDomains || [];
            if (!candidateDomains.includes(domain)) {
              candidateDomains.push(domain);
              chrome.storage.sync.set({ candidateDomains });
              console.log("🌍 Added candidate domain:", domain);
            }
          });
        }
      }
    });

})(); //👈👈 don't delete this, and don't put anything outside of this!!



