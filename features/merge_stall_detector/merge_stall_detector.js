// Stalled Merge Detector for Bubble Editor
window.loadedCodelessLoveScripts ||= {};
(function() {
  let thisScriptKey = "merge_stall_detector";
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";

  let stallMessageShown = false;
  let stallTimeout = null;

  function showStallMessage() {
    if (document.getElementById('codelesslove_stall_detected')) return;
    const logoUrl = chrome.runtime.getURL('extension-icons/icon-21.png');
    const div = document.createElement('div');
    div.id = 'codelesslove_stall_detected';
    div.className = 'codelesslove-stall-message';
    div.innerHTML = "" + 
    `<div class="codelesslove-header">` + 
    `    <img class="codelesslove-logo" src="${logoUrl}" alt="Codeless Love Icon" />` + 
    `    <span class="codelesslove-title">Merge Stall Detected!</span>` + 
    `    <button class="codelesslove-close" title="Close">×</button>` + 
    `</div>` + 
    `<div class="codelesslove-body">` + 
    `    <p>Looks like your merge failed to start!</p>` + 
    `    <p><b>Suggested fix</b>: Change to another page. This sometimes wakes up the merge process so you can continue.</p>` + 
    `</div>`;
    document.body.appendChild(div);
    // Add close button handler
    const closeBtn = div.querySelector('.codelesslove-close');
    if (closeBtn) {
      closeBtn.onclick = hideStallMessage;
    }
  }

  function hideStallMessage() {
    const div = document.getElementById('codelesslove_stall_detected');
    if (div) div.remove();
  }

  function checkForStalledMerge() {
    console.log("Check for Stalled Merge")
    // If the merge window appears, always hide the stall message
    if (document.querySelector('.merge-changes-window')) {
      hideStallMessage();
      stallMessageShown = false;
      if (stallTimeout) {
        clearTimeout(stallTimeout);
        stallTimeout = null;
      }
      return;
    }
    // If a merge is in progress and we haven't shown the message yet, set a timeout
    if (document.querySelector('.merge-progress-bar') && !stallMessageShown && !stallTimeout) {
      stallTimeout = setTimeout(() => {
        if (!document.querySelector('.merge-changes-window')) {
          showStallMessage();
          stallMessageShown = true;
        }
      }, 15000);
    }
  }

  // Run on load and whenever the DOM changes (in case merge starts after load)
  checkForStalledMerge();
  const observer = new MutationObserver(checkForStalledMerge);
  observer.observe(document.body, { childList: true, subtree: true });
})();
