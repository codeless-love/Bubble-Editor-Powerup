window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Inline Branch Delete");
  let thisScriptKey = "inline_branch_delete";

  // Injection prevention check (one-liner, don't modify)
  /* You can ignore all the stuff on this line, but don't delete! */ console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Constants
  const BRANCH_NAME_WIDTH = 160;
  const FETCH_INTERVAL = 5000; // Refresh mapping every 5 seconds
  const UPDATE_INTERVAL = 10000; // Update every 10 seconds
  const RETRY_MAX_ATTEMPTS = 10;
  const RETRY_INTERVAL = 500; // Retry every 500ms
  const UI_SETTLE_DELAY = 1500; // Wait for UI to settle
  const BRANCH_CREATE_DELAY = 1000; // Wait after branch creation
  const DEBOUNCE_DELAY = 100; // Debounce delay for aggressive observer
  const DROPDOWN_Z_INDEX = 2147483647; // Maximum z-index
  const MENU_BUTTON_SIZE = 24;
  const DROPDOWN_OFFSET = -4; // Pixels between button and dropdown
  const MODAL_Z_INDEX = 100000000;
  const MODAL_WIDTH = 400;
  const RESERVED_BRANCH_NAMES = ['test', 'live', 'main', 'development'];
  const BRANCH_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9\-_]*$/;
  const MAX_BRANCH_NAME_LENGTH = 255;

  // Add CSS to adjust branch name container width
  const style = document.createElement('style');
  style.textContent = `
    .branch-name-icon-container {
      width: ${BRANCH_NAME_WIDTH}px !important;
      max-width: ${BRANCH_NAME_WIDTH}px !important;
    }
  `;
  document.head.appendChild(style);

  // Store mapping of display names to IDs
  let branchNameToIdMap = {};
  let lastFetchTime = 0;

  // Global event handlers management
  const globalClickHandler = new WeakMap();
  let processDebounceTimer = null;

  /**
   * Validates a branch name according to Bubble's requirements
   * @param {string} name - The branch name to validate
   * @returns {{valid: boolean, error?: string}} Validation result
   */
  function validateBranchName(name) {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Branch name cannot be empty' };
    }

    if (name.length > MAX_BRANCH_NAME_LENGTH) {
      return { valid: false, error: `Branch name cannot exceed ${MAX_BRANCH_NAME_LENGTH} characters` };
    }

    if (RESERVED_BRANCH_NAMES.includes(name.toLowerCase())) {
      return { valid: false, error: `"${name}" is a reserved branch name` };
    }

    if (!BRANCH_NAME_PATTERN.test(name)) {
      return { valid: false, error: 'Branch name must start with a letter or number and contain only letters, numbers, hyphens, and underscores' };
    }

    return { valid: true };
  }

  /**
   * Fetches and updates the mapping of branch display names to IDs
   * @param {boolean} force - Force update even if recently fetched
   * @returns {Promise<void>}
   */
  async function updateBranchMapping(force = false) {
    try {
      const currentTime = Date.now();
      if (!force && currentTime - lastFetchTime < FETCH_INTERVAL) {
        return; // Don't fetch too frequently
      }

      lastFetchTime = currentTime;
      console.log('❤️ Fetching version metadata for branch mapping');

      const versions = window.get_version_metadata(true);
      branchNameToIdMap = {};

      // Build the mapping
      Object.entries(versions).forEach(([id, data]) => {
        if (id !== 'live' && id !== 'test' && !data.deleted && data.access_permitted !== false) {
          const displayName = data.display || id;
          branchNameToIdMap[displayName] = id;
          // Also store the ID itself as a key (in case display name equals ID)
          branchNameToIdMap[id] = id;
        }
      });

      console.log('❤️ Updated branch mapping:', branchNameToIdMap);
    } catch (error) {
      console.error('❤️ Error updating branch mapping:', error);
    }
  }

  /**
   * Extracts branch information from a DOM row element
   * @param {Element} branchRow - The branch row DOM element
   * @returns {{displayName: string, id: string}|null} Branch info or null if not found
   */
  function extractBranchInfo(branchRow) {
    // Try to find the branch name span
    const branchNameSpan = branchRow.querySelector('.branch-name-icon-container ._1nfonn86._1lkv1fwa');
    if (branchNameSpan) {
      // Skip system branches
      const branchName = branchNameSpan.textContent.trim();
      if (RESERVED_BRANCH_NAMES.includes(branchName.toLowerCase())) {
        return null;
      }

      // Look up the actual ID from our mapping
      const actualId = branchNameToIdMap[branchName];
      if (!actualId) {
        console.warn('❤️ Could not find ID for branch:', branchName);
        // Try to update mapping
        updateBranchMapping().then(() => {
          // Re-process this row after updating mapping
          if (branchNameToIdMap[branchName]) {
            processBranchRow(branchRow);
          }
        }).catch(error => {
          console.error('❤️ Error updating branch mapping:', error);
        });
        return null;
      }

      return {
        displayName: branchName,
        id: actualId
      };
    }
    return null;
  }

  /**
   * Creates and displays a modal for branch creation
   * @param {string} fromBranchId - ID of the branch to create from
   * @param {string} fromBranchName - Display name of the branch to create from
   * @returns {Promise<string|null>} Promise resolving to branch name or null if cancelled
   */
  function createBranchModal(fromBranchId, fromBranchName) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'branch-modal-overlay';
    overlay.style.cssText = `z-index: ${MODAL_Z_INDEX};`;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'branch-modal';
    modal.style.cssText = `width: ${MODAL_WIDTH}px;`;

    modal.innerHTML = `
      <h2>Create New Branch</h2>
      <p>
        Creating from: <strong>${fromBranchName}</strong>
      </p>
      <input
        type="text"
        id="branch-name-input"
        placeholder="Enter branch name"
      />
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button
          id="branch-cancel"
        >Cancel</button>
        <button
          id="branch-create"
        >Create Branch</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Focus input
    const input = modal.querySelector('#branch-name-input');
    input.focus();

    // Add hover effects
    const cancelBtn = modal.querySelector('#branch-cancel');
    const createBtn = modal.querySelector('#branch-create');

    // Return promise for branch creation
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        document.body.removeChild(overlay);
      };

      // Cancel button
      cancelBtn.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      // Create button
      const createBranch = async () => {
        const branchName = input.value.trim();
        if (!branchName) {
          input.style.borderColor = '#e74c3c';
          input.focus();
          return;
        }

        // Validate branch name
        const validation = validateBranchName(branchName);
        if (!validation.valid) {
          alert(validation.error);
          input.style.borderColor = '#e74c3c';
          input.focus();
          return;
        }

        // Check if branch already exists
        if (branchNameToIdMap[branchName]) {
          alert(`Branch "${branchName}" already exists`);
          input.style.borderColor = '#e74c3c';
          input.focus();
          return;
        }

        try {
          createBtn.disabled = true;
          createBtn.textContent = 'Creating...';

          console.log('❤️ Creating new branch:', branchName, 'from:', fromBranchId);

          // Unfortunately, we can't auto-accept Bubble's alerts as they seem to require actual user interaction
          // The user will need to manually accept the confirmation dialogs
          await window.create_new_app_version(branchName, fromBranchId);

          // Wait a moment for the branch to be created
          await new Promise(resolve => setTimeout(resolve, BRANCH_CREATE_DELAY));

          // Force update mapping to get the new branch ID
          await updateBranchMapping(true);

          // Get the ID of the newly created branch
          const newBranchId = branchNameToIdMap[branchName];
          if (newBranchId) {
            console.log('❤️ Switching to new branch:', newBranchId);
            try {
              await window.change_to_version(newBranchId);

              // Wait for the UI to update after switching
              await new Promise(resolve => setTimeout(resolve, UI_SETTLE_DELAY));

              // Force process all branch rows to ensure the new branch gets its menu
              processAllBranchRows();

              // Also set up an interval to retry processing for the new branch
              let retries = 0;
              const retryInterval = setInterval(() => {
                const found = ensureBranchHasMenu(branchName);
                if (found || retries > RETRY_MAX_ATTEMPTS) {
                  if (!found) {
                    // Final attempt - process all rows
                    processAllBranchRows();
                  }
                  clearInterval(retryInterval);
                }
                retries++;
              }, RETRY_INTERVAL);
            } catch (switchError) {
              console.error('❤️ Error switching to new branch:', switchError);
            }
          } else {
            console.warn('❤️ Could not find ID for newly created branch:', branchName);
          }

          cleanup();
          resolve(branchName);
        } catch (error) {
          console.error('❤️ Error creating branch:', error);
          alert(`Failed to create branch: ${error.message}`);
          createBtn.disabled = false;
          createBtn.textContent = 'Create Branch';
        }
      };

      createBtn.addEventListener('click', createBranch);

      // Enter key support
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          createBranch();
        }
      });

      // Escape key support
      document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
          cleanup();
          resolve(null);
          document.removeEventListener('keydown', escapeHandler);
        }
      });

      // Click outside to close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });
    });
  }

  /**
   * Deletes a branch after user confirmation
   * @param {string} branchId - The ID of the branch to delete
   * @param {string} displayName - The display name of the branch
   * @returns {Promise<void>}
   */
  async function deleteBranch(branchId, displayName) {
    try {
      // Get app ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const appId = urlParams.get('id');

      if (!appId) {
        throw new Error('Could not find app ID in URL');
      }

      // Show confirmation dialog with display name
      if (!confirm(`Are you sure you want to delete branch "${displayName}" (ID: ${branchId})?`)) {
        return;
      }

      console.log('❤️ Executing branch deletion for version:', branchId);

      // Execute deletion using Lib() which is available in the Bubble editor context
      return new Promise((resolve, reject) => {
        Lib().location.post("server://appeditor/delete_app_version", {
          appname: appId,
          app_version: branchId,
          soft_delete: true
        }, (err, res) => {
          if (err) {
            console.error('❤️ Error deleting branch:', err);
            alert(`Failed to delete branch: ${err}`);
            reject(err);
          } else {
            console.log('❤️ Successfully deleted branch:', branchId);
            // Update mapping after deletion
            setTimeout(() => updateBranchMapping(true), BRANCH_CREATE_DELAY);
            resolve(res);
          }
        });
      });
    } catch (error) {
      console.error('❤️ Error in deleteBranch:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Creates a three-dot menu button with dropdown for branch actions
   * @param {{id: string, displayName: string}} branchInfo - Branch information
   * @returns {Element} The menu container element
   */
  function createMenuButton(branchInfo) {
    const menuContainer = document.createElement('div');
    menuContainer.className = 'branch-menu-container';

    // Create the three-dot button
    const menuButton = document.createElement('button');
    menuButton.className = 'branch-menu-button';
    menuButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
      </svg>
    `;
    menuButton.style.cssText = `
      width: ${MENU_BUTTON_SIZE}px;
      height: ${MENU_BUTTON_SIZE}px;
    `;

    // Create the dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'branch-menu-dropdown';
    dropdown.style.cssText = `z-index: ${DROPDOWN_Z_INDEX};`;

    // Create branch option
    const createOption = document.createElement('button');
    createOption.setAttribute("class", 'branch-menu-option create');
    createOption.textContent = 'Create Branch';

    const deleteOption = document.createElement('button');
    deleteOption.setAttribute("class", 'branch-menu-option delete');
    deleteOption.textContent = 'Delete Branch';

    // Click handlers
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';

      // Close all other dropdowns
      document.querySelectorAll('.branch-menu-dropdown').forEach(d => {
        d.style.display = 'none';
      });
      document.querySelectorAll('.branch-menu-button').forEach(btn => {
        btn.style.background = 'none';
        btn.style.color = '#6c757d';
      });

      // Toggle this dropdown
      if (!isOpen) {
        // Position the dropdown based on button location
        const rect = menuButton.getBoundingClientRect();
        dropdown.style.display = 'block';
        dropdown.style.top = (rect.top + DROPDOWN_OFFSET) + 'px';
        // Align dropdown's right edge with button's right edge so it extends left
        dropdown.style.left = (rect.right - dropdown.offsetWidth) + 'px';
        menuButton.style.background = '#f0f0f0';
        menuButton.style.color = '#333';
      } else {
        dropdown.style.display = 'none';
      }
    });

    createOption.addEventListener('click', async (e) => {
      e.stopPropagation();
      dropdown.style.display = 'none';
      menuButton.style.background = 'none';
      menuButton.style.color = '#6c757d';
      await createBranchModal(branchInfo.id, branchInfo.displayName);
    });

    deleteOption.addEventListener('click', async (e) => {
      e.stopPropagation();
      dropdown.style.display = 'none';
      menuButton.style.background = 'none';
      menuButton.style.color = '#6c757d';
      await deleteBranch(branchInfo.id, branchInfo.displayName);
    });

    // Close dropdown when clicking outside - store handler for cleanup
    const closeDropdownHandler = (e) => {
      if (!menuContainer.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
        menuButton.style.background = 'none';
        menuButton.style.color = '#6c757d';
      }
    };

    // Store the handler for later cleanup
    globalClickHandler.set(dropdown, closeDropdownHandler);
    document.addEventListener('click', closeDropdownHandler);

    dropdown.appendChild(createOption);
    dropdown.appendChild(deleteOption);
    menuContainer.appendChild(menuButton);

    // Append dropdown to body to avoid overflow issues
    document.body.appendChild(dropdown);

    // Store reference to dropdown on button for cleanup
    menuButton._dropdown = dropdown;

    return menuContainer;
  }

  /**
   * Processes a branch row element to add menu buttons
   * @param {Element} branchRow - The branch row DOM element
   */
  function processBranchRow(branchRow) {
    // Skip if already processed
    if (branchRow.querySelector('.branch-menu-container')) {
      return;
    }

    // Skip live, test, and development rows
    if (branchRow.classList.contains('live') ||
        branchRow.classList.contains('test') ||
        branchRow.querySelector('.branch-env-row.env:not(.branch)')) {
      return;
    }

    // Extract branch info
    const branchInfo = extractBranchInfo(branchRow);
    if (!branchInfo) {
      return;
    }
    // Find the container to add the menu to
    const innerContainer = branchRow.querySelector('.branches-container .branch-env-row ._1ql74v32._1ql74v30._1ql74v39._1ql74v3b._1ql74v3h');
    if (!innerContainer) {
      return;
    }

    // Create and add the menu button
    const menuButton = createMenuButton(branchInfo);
    innerContainer.appendChild(menuButton);
  }

  /**
   * Processes all branch rows in the document
   */
  function processAllBranchRows() {
    document.querySelectorAll('.branch-env-row.branch').forEach(processBranchRow);
  }

  /**
   * Debounced version of processAllBranchRows to prevent excessive calls
   */
  function debouncedProcessAllBranchRows() {
    clearTimeout(processDebounceTimer);
    processDebounceTimer = setTimeout(() => processAllBranchRows(), DEBOUNCE_DELAY);
  }

  /**
   * Ensures a specific branch has a menu button by branch name
   * @param {string} branchName - The name of the branch
   * @returns {boolean} True if branch was found and processed
   */
  function ensureBranchHasMenu(branchName) {
    // Try multiple selectors to find the branch row
    const selectors = [
      `.branch-env-row.branch span:contains("${branchName}")`,
      `.branch-env-row.branch span[title="${branchName}"]`,
      `.branch-env-row.branch`
    ];

    // Find all branch rows and check their text content
    const branchRows = document.querySelectorAll('.branch-env-row.branch');
    for (const row of branchRows) {
      const nameSpan = row.querySelector('span._1nfonn86._1lkv1fw9:not(._1ij2r33)');
      if (nameSpan && nameSpan.textContent.trim() === branchName) {
        processBranchRow(row);
        return true;
      }
    }
    return false;
  }

  /**
   * Cleans up orphaned dropdown menus and their event listeners
   */
  function cleanupRemovedMenus() {
    // Find all dropdown menus that are orphaned (button no longer in DOM)
    document.querySelectorAll('.branch-menu-dropdown').forEach(dropdown => {
      const button = Array.from(document.querySelectorAll('.branch-menu-button')).find(btn => btn._dropdown === dropdown);
      if (!button || !document.body.contains(button)) {
        // Remove event listener if it exists
        const handler = globalClickHandler.get(dropdown);
        if (handler) {
          document.removeEventListener('click', handler);
          globalClickHandler.delete(dropdown);
        }
        dropdown.remove();
      }
    });
  }

  // Set up MutationObserver to watch for branch rows
  const observer = new MutationObserver((mutations) => {
    let hasChanges = false;

    mutations.forEach((mutation) => {
      // Check for added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if it's a branch row
          if (node.classList && node.classList.contains('branch-env-row') && node.classList.contains('branch')) {
            processBranchRow(node);
            hasChanges = true;
          }

          // Also check children
          const branchRows = node.querySelectorAll ? node.querySelectorAll('.branch-env-row.branch') : [];
          branchRows.forEach(row => {
            processBranchRow(row);
            if (branchRows.length > 0) hasChanges = true;
          });
        }
      });

      // Check for removed nodes
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // If branch rows were removed, clean up orphaned dropdowns
          if (node.classList && (node.classList.contains('branch-env-row') || node.querySelector('.branch-env-row'))) {
            cleanupRemovedMenus();
            hasChanges = true;
          }
        }
      });
    });

    // If we detected changes, update the branch mapping
    if (hasChanges) {
      updateBranchMapping();
    }
  });

  // Watch for changes to branch list visibility/content
  const versionObserver = new MutationObserver(() => {
    // Re-process all branch rows when the version panel updates
    processAllBranchRows();
    updateBranchMapping();
  });

  // Aggressive observer for catching new branches
  const aggressiveObserver = new MutationObserver((mutations) => {
    // Check if any text content contains branch names that don't have menus yet
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        // Use debounced version to prevent excessive calls
        debouncedProcessAllBranchRows();
        break;
      }
    }
  });

  /**
   * Initializes the inline branch delete feature
   */
  function initialize() {
    updateBranchMapping().then(() => {
    // Process existing branch rows after mapping is ready
    processAllBranchRows();

    // Start observing the entire document for branch row changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also observe the version panel specifically if we can find it
    const versionPanel = document.querySelector('.versions-panel, [class*="version"], [class*="branch"]');
    if (versionPanel) {
      versionObserver.observe(versionPanel, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
    }

    // Set up aggressive observer for the branches container
    const branchesContainer = document.querySelector('.branches-container, .branch-list-container');
    if (branchesContainer) {
      aggressiveObserver.observe(branchesContainer, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: true
      });
    }
    }).catch(error => {
      console.error('❤️ Error during initialization:', error);
    });
  }

  // Start initialization
  initialize();

  // Periodically update the mapping and re-process rows
  const updateInterval = setInterval(() => {
    updateBranchMapping();
    processAllBranchRows();
    cleanupRemovedMenus();
  }, UPDATE_INTERVAL);

  // Cleanup on unload
  window.addEventListener('unload', () => {
    observer.disconnect();
    versionObserver.disconnect();
    aggressiveObserver.disconnect();
    clearInterval(updateInterval);
    // Remove all dropdowns and their event listeners
    document.querySelectorAll('.branch-menu-dropdown').forEach(dropdown => {
      const handler = globalClickHandler.get(dropdown);
      if (handler) {
        document.removeEventListener('click', handler);
        globalClickHandler.delete(dropdown);
      }
      dropdown.remove();
    });
  });

})(); // IIFE wrapper - don't put code outside
