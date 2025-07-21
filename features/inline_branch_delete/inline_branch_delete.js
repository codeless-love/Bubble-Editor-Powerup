window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Inline Branch Delete");
  let thisScriptKey = "inline_branch_delete";
  
  // Injection prevention check (one-liner, don't modify)
  /* You can ignore all the stuff on this line, but don't delete! */ console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);
  
  // Store mapping of display names to IDs
  let branchNameToIdMap = {};
  let lastFetchTime = 0;
  const FETCH_INTERVAL = 5000; // Refresh mapping every 5 seconds
  
  // Function to fetch and update branch mapping
  async function updateBranchMapping() {
    try {
      const currentTime = Date.now();
      if (currentTime - lastFetchTime < FETCH_INTERVAL) {
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
  
  // Helper to extract branch ID from the DOM structure
  function extractBranchInfo(branchRow) {
    // Try to find the branch name span
    const branchNameSpan = branchRow.querySelector('span._1nfonn86._1lkv1fw9:not(._1ij2r33)');
    if (branchNameSpan) {
      // Skip system branches
      const branchName = branchNameSpan.textContent.trim();
      if (branchName === 'Live' || branchName === 'Test' || branchName === 'Main' || branchName === 'Development') {
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
  
  // Function to delete a branch
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
            alert(`Successfully deleted branch "${displayName}"`);
            // Update mapping after deletion
            setTimeout(updateBranchMapping, 1000);
            resolve(res);
          }
        });
      });
    } catch (error) {
      console.error('❤️ Error in deleteBranch:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Function to create the three-dot menu button
  function createMenuButton(branchInfo) {
    const menuContainer = document.createElement('div');
    menuContainer.className = '❤️branch-menu-container';
    menuContainer.style.cssText = `
      position: relative;
      margin-left: auto;
      display: flex;
      align-items: center;
    `;
    
    // Create the three-dot button
    const menuButton = document.createElement('button');
    menuButton.className = '❤️branch-menu-button';
    menuButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="3" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="13" r="1.5" fill="currentColor"/>
      </svg>
    `;
    menuButton.style.cssText = `
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #6c757d;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `;
    
    // Create the dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = '❤️branch-menu-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: none;
      z-index: 1000;
      min-width: 120px;
    `;
    
    const deleteOption = document.createElement('button');
    deleteOption.className = '❤️branch-menu-option';
    deleteOption.textContent = 'Delete Branch';
    deleteOption.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px 12px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      color: #e74c3c;
      font-size: 13px;
      transition: background-color 0.2s;
    `;
    
    // Hover effects
    menuButton.addEventListener('mouseenter', () => {
      menuButton.style.background = '#f0f0f0';
      menuButton.style.color = '#333';
    });
    
    menuButton.addEventListener('mouseleave', () => {
      if (dropdown.style.display === 'none') {
        menuButton.style.background = 'none';
        menuButton.style.color = '#6c757d';
      }
    });
    
    deleteOption.addEventListener('mouseenter', () => {
      deleteOption.style.backgroundColor = '#fff5f5';
    });
    
    deleteOption.addEventListener('mouseleave', () => {
      deleteOption.style.backgroundColor = 'transparent';
    });
    
    // Click handlers
    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';
      
      // Close all other dropdowns
      document.querySelectorAll('.❤️branch-menu-dropdown').forEach(d => {
        d.style.display = 'none';
        d.parentElement.querySelector('.❤️branch-menu-button').style.background = 'none';
        d.parentElement.querySelector('.❤️branch-menu-button').style.color = '#6c757d';
      });
      
      // Toggle this dropdown
      dropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) {
        menuButton.style.background = '#f0f0f0';
        menuButton.style.color = '#333';
      }
    });
    
    deleteOption.addEventListener('click', async (e) => {
      e.stopPropagation();
      dropdown.style.display = 'none';
      menuButton.style.background = 'none';
      menuButton.style.color = '#6c757d';
      await deleteBranch(branchInfo.id, branchInfo.displayName);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
      menuButton.style.background = 'none';
      menuButton.style.color = '#6c757d';
    });
    
    dropdown.appendChild(deleteOption);
    menuContainer.appendChild(menuButton);
    menuContainer.appendChild(dropdown);
    
    return menuContainer;
  }
  
  // Function to process branch rows
  function processBranchRow(branchRow) {
    // Skip if already processed
    if (branchRow.querySelector('.❤️branch-menu-container')) {
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
    const innerContainer = branchRow.querySelector('._1ql74v32._1ql74v30._1ql74v39._1ql74v3b._1ql74v3h');
    if (!innerContainer) {
      return;
    }
    
    // Create and add the menu button
    const menuButton = createMenuButton(branchInfo);
    innerContainer.appendChild(menuButton);
  }
  
  // Function to process all branch rows
  function processAllBranchRows() {
    document.querySelectorAll('.branch-env-row.branch').forEach(processBranchRow);
  }
  
  // Set up MutationObserver to watch for branch rows
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if it's a branch row
          if (node.classList && node.classList.contains('branch-env-row') && node.classList.contains('branch')) {
            processBranchRow(node);
          }
          
          // Also check children
          const branchRows = node.querySelectorAll ? node.querySelectorAll('.branch-env-row.branch') : [];
          branchRows.forEach(processBranchRow);
        }
      });
    });
  });
  
  // Initial setup
  updateBranchMapping().then(() => {
    // Process existing branch rows after mapping is ready
    processAllBranchRows();
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
  
  // Periodically update the mapping
  setInterval(updateBranchMapping, 30000); // Update every 30 seconds
  
})(); // IIFE wrapper - don't put code outside