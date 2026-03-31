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

  function showNotificationNotice() {
    if (document.getElementById('❤️notification_overlay')) return;

    const logoUrl = chrome.runtime.getURL('extension-icons/icon-21.png');
    const overlay = document.createElement('div');
    overlay.id = 'codelesslove_notification_overlay';
    overlay.innerHTML = `
    <div id="notification" class="❤️notification">
        <div class="❤️header">
            <img class="❤️logo" src="${logoUrl}" alt="Codeless Love Icon" />
            <h1 class="❤️title">Powerup got a Powerup!</h1>
            <button class="❤️close" title="Close">×</button>
        </div>
        <div class="❤️body">
            <p>You've just updated to version ${currentAppVersion}</p>
            <h2 class="section-header">New Features</h2>
            <ul class="features-list">
                <li>
                    <b>Syntax Highlighting</b>
                    <p class="feature-description">Expressions are now easier to read with colored operators.</p>
                    <div class="feature-contributors">Contributors: Brenton Strine</div>
                </li>
                <li>
                    <b>Dark Mode</b>
                    <p class="feature-description">So you can look like a leet hacker while programming at night.</p>
                    <div class="feature-contributors">Contributors: Brenton Strine</div>
                </li>
                <li>
                    <b>Expression Prank Depranker</b>
                    <p class="feature-description">In some circumstances clicking on the beginning of an expression would delete your expression. This fixes that.</p>
                    <div class="feature-contributors">Contributors: Brenton Strine</div>
                </li>
                <li>
                    <b>Popup Search and Filtering</b>
                    <p class="feature-description">Find features easier with searching and filtering.</p>
                    <div class="feature-contributors">Contributors: Rico Trevisan</div>
                </li>
                <li>
                    <b>Popup Refinement</b>
                    <p class="feature-description">Add collapsible accordions to categories and tighten up the spacing.</p>
                    <div class="feature-contributors">Contributors: Rico Trevisan</div>
                </li>
                <li>
                    <b>Toggle Debug Mode</b>
                    <p class="feature-description">In runtime, toggle debug_mode on and off through the Powerup popup.</p>
                    <div class="feature-contributors">Contributors: Brenton Strine</div>
                </li>
                <li>
                    <b>Contributor Credit</b>
                    <p class="feature-description">Info on who contributed to which features, so you can say "thanks!"</p>
                </li>
            </ul>
            <h2 class="section-header">Bug Fixes</h2>
            <ul class="fixes-list">
                <li>
                  <b>Bulk Branch Delete</b>
                  <p class="feature-description">Should now appear inline again as well as in the popup under the feature card.</p>
                </li>
                <li>
                  <b>Search Bookmark</b>
                  <p class="feature-description">Was broken before but should work again now.</p>
                </li>
                <li>
                  <b>Powerup Feature Changes Refresh Buttons</b>
                  <p class="feature-description">Fix refresh buttons so you can easily refresh the tab(s) after making changes to your feature configuration.</p>
                </li>
                <li>
                  <b>Removed the feature "Maximize App Interface Manager dropdown in top menubar"</b>
                  <p class="feature-description">This feature was broken due to a Bubble update. The new Bubble menu is much better, making this feature unecessary.</p>
                </li>
                <li>
                  <b>General Fixes</b>
                  <p class="feature-description">Made general improvements to extension organizatoin and set the foundation for future contributions.</p>
                </li>
            </ul>
            <p class="❤️note">Thank you for using the Powerup extension! You can help by suggesting ideas, sharing with a friend, or even contributing new features!
            
            -Brenton</p>
        </div>
        <div class="❤️footer">
          <button class="❤️dismiss-button">Dismiss</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    const close = () => {
      // On dismiss, save the current manifest version
      chrome.storage.sync.set({ [STORAGE_KEY]: currentAppVersion });
      overlay.remove();
    };

    const closeBtn = overlay.querySelector('.❤️close');
    if (closeBtn) {
      closeBtn.onclick = close;
    }

    const dismissBtn = overlay.querySelector('.❤️dismiss-button');
    if (dismissBtn) {
      dismissBtn.onclick = close;
    }
  }

  // Check if the user has already seen the notice for this version
  chrome.storage.sync.get(STORAGE_KEY, (result) => {
    const lastSeenVersion = result[STORAGE_KEY];
    if (compareVersions(currentAppVersion, lastSeenVersion) > 0) {
      showNotificationNotice();
    }
  });
})();
