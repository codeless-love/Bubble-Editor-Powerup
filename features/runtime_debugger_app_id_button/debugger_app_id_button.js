
window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️Debugger App ID Button feature loaded");
  let thisScriptKey = "debugger_app_id_button";

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
  // 2. Replace the example text on line 3with the name of your feature on line 3 of this file.
  // 3. Replace the example key on line 4 with your feature's script (snake_case preferred) on line 4 of this file.
  // 4. Insert any Javascript here. Don't put anything after the })(); at the end.
  // 5. Delete the "main world" injection demo code on lines 32-36, and delete the example script as well.
  /* ------------------------------------------------------------------- */


  // Only activate if debug_mode=true is in the URL
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug_mode") !== "true") {
    return;
  }
  let domain = "";
  let app_id = "";
  function insertButton() {
  // Wait for .debugger-canvas .top-bar to exist
    const topBar = document.querySelector('.debugger-canvas .top-bar');
    if (!topBar) {
      setTimeout(insertButton, 500);
      return;
    }
    // Prevent duplicate button
    if (topBar.querySelector('.codelesslove-appid-btn')) return;
    const btn = document.createElement('button');
    btn.textContent = '❤️ App Info';
    btn.className = 'codelesslove-appid-btn';
    btn.style.marginLeft = '12px';
    btn.onclick = function() {
      alert(`App ID: ${app_id}\nApp Domain: ${domain}`);
    };
    topBar.appendChild(btn);
  }

  // Listen for messages from the main world
  window.addEventListener('message', (event) => {
    if (
        event.source === window &&
        event.data &&
        event.data.source === 'main-world-script' &&
        event.data.action === 'appDomainResult'
    ) {
      domain = event.data.payload?.domain;
      app_id = event.data.payload?.app_id;
      insertButton();
    }
  });
})(); //👈👈 don't delete this, and don't put anything outside of this!!








