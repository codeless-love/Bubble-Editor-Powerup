window.loadedCodelessLoveScripts ||= {};
(function() {
  const thisScriptKey = "notification";
  if (window.loadedCodelessLoveScripts[thisScriptKey] === "loaded") {
    console.warn(`❤️${thisScriptKey} tried to load, but it's value is already ${window.loadedCodelessLoveScripts[thisScriptKey]}`);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";

  const STORAGE_KEY = 'codelessLoveLastSeenVersion';
  const manifest = chrome.runtime.getManifest();
  const currentAppVersion = manifest.version;

  /**
   * Compares two version strings (e.g., "1.2.3" vs "1.2.4").
   * @param {string} v1 The first version string.
   * @param {string} v2 The second version string.
   * @returns {number} -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2.
   */
  function compareVersions(v1, v2) {
    if (!v2) return 1; // If no old version, new one is always greater

    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const len = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < len; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  function showNotificatoinNotice() {
    if (document.getElementById('codelesslove_notification')) return;

    const logoUrl = chrome.runtime.getURL('extension-icons/icon-21.png');
    const div = document.createElement('div');
    div.id = 'codelesslove_notification';
    // Reusing the class from the merge stall detector for consistent styling
    div.className = 'codelesslove-stall-message';
    div.innerHTML = `
    <div class="codelesslove-header">
        <img class="codelesslove-logo" src="${logoUrl}" alt="Codeless Love Icon" />
        <span class="codelesslove-title">Powerup got a Powerup!</span>
        <button class="codelesslove-close" title="Close">×</button>
    </div>
    <div class="codelesslove-body">
        <p><b>Just Dropped</b> in v${currentAppVersion}</p>
        <ul>
            <li><b>Syntax Highlighting:</b> Expressions are now easier to read with colored operators. Thanks: Brenton Strine</li>
            <li><b>Dark Mode:</b> So you can look like a leet hacker while programming at night. Thanks: Brenton Strine</li>
            <li><b>Expression Prank Depranker:</b> In some circumstances clicking on the beginning of an expression would delete your expression. This fixes that. Thanks: Brenton Strine</li>
            <li><b>Popup Search and Filtering:</b> Find features easier with searching and filtering. Thanks: Rico Trevisan</li>
            <li><b>Popup Refinement:</b> Add collapsible accordions to categories and tighten up the spacing. Thanks: Rico Trevisan</li>
            <li><b>Toggle Debug Mode</b> In runtime, toggle debug_mode on and off through the Powerup popup. Thanks: Brenton Strine</li>
            <li><b>Contributor Credit:</b> Info on who contributed to which features, so you can say "thanks!"</li>
        </ul>
        <p><b>Bug Fixes</b></p>
        <ul>
            <li>Bulk Branch Delete</li>
            <li>Search Bookmark</li>
        </ul>
    </div>`;
    document.body.appendChild(div);

    const closeBtn = div.querySelector('.codelesslove-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        // On dismiss, save the current manifest version
        chrome.storage.sync.set({ [STORAGE_KEY]: currentAppVersion });
        div.remove();
      }
    }
  }

  // Check if the user has already seen the notice for this version
  chrome.storage.sync.get(STORAGE_KEY, (result) => {
    const lastSeenVersion = result[STORAGE_KEY];
    if (compareVersions(currentAppVersion, lastSeenVersion) > 0) {
      showNotificatoinNotice();
    }
  });
})();
