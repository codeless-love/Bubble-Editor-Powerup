window.loadedCodelessLoveScripts ||= {};
(function() {
  const thisScriptKey = "notification";
  if (window.loadedCodelessLoveScripts[thisScriptKey] === "loaded") {
    console.warn(`❤️${thisScriptKey} tried to load, but it's value is already ${window.loadedCodelessLoveScripts[thisScriptKey]}`);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";

  // This version string should be updated with each new release that has a "what's new" notice.
  const CURRENT_VERSION = "2.0.0";
  const STORAGE_KEY = 'codelessLoveLastSeenVersion';

  function showWhatsNewNotice() {
    if (document.getElementById('codelesslove_notification')) return;

    const logoUrl = chrome.runtime.getURL('extension-icons/icon-21.png');
    const div = document.createElement('div');
    div.id = 'codelesslove_notification';
    // Reusing the class from the merge stall detector for consistent styling
    div.className = 'codelesslove-stall-message';
    div.innerHTML = `
    <div class="codelesslove-header">
        <img class="codelesslove-logo" src="${logoUrl}" alt="Codeless Love Icon" />
        <span class="codelesslove-title">What's New in Powerup!</span>
        <button class="codelesslove-close" title="Close">×</button>
    </div>
    <div class="codelesslove-body">
        <p><b>Thanks for updating!</b> Here are some of the new features:</p>
        <ul>
            <li><b>Syntax Highlighting:</b> Expressions are now easier to read with colored operators.</li>
            <li><b>Bad Practice Warnings:</b> Get notified about common performance issues in your expressions.</li>
            <li><b>And more!</b> Check the extension popup to see all features.</li>
        </ul>
    </div>`;
    document.body.appendChild(div);

    const closeBtn = div.querySelector('.codelesslove-close');
    if (closeBtn) {
      closeBtn.onclick = () => div.remove();
    }
  }

  // Check if the user has already seen the notice for this version
  chrome.storage.sync.get(STORAGE_KEY, (result) => {
    if (result[STORAGE_KEY] !== CURRENT_VERSION) {
      showWhatsNewNotice();
      chrome.storage.sync.set({ [STORAGE_KEY]: CURRENT_VERSION });
    }
  });
})();
