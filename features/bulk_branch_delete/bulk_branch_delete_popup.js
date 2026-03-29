// Fast Branch Delete functionality for the extension popup
// This module handles the UI and logic for deleting Bubble app branches

(function() {
  console.log("❤️ Fast Branch Delete module loaded into popup");

  // 1. Create and inject the HTML for the tool
  const featureDiv = document.getElementById('bulk_branch_delete')?.closest('.feature');
  if (!featureDiv) {
    console.error("❤️ Bulk Branch Delete: Could not find feature container in popup.");
    return;
  }

  const toolHtml = `
    <div class="tool-section">
      <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 1em;">
        Quickly delete one or more branches by selecting them from the list. This will execute a soft delete on all selected branches.
      </p>
      <div class="branch-delete-container">
        <div class="branch-list-container">
          <div id="branch-list" class="branch-list">
            <div class="branch-list-loading">Loading versions...</div>
          </div>
        </div>
        <div class="row" style="gap: 8px; margin-bottom: 1em;">
          <button id="branch-select-none" class="button-secondary" style="padding: 4px 8px; font-size: 12px; display: none;">
            Clear Selection
          </button>
          <span id="branch-selection-count" style="font-size: 13px; color: var(--text-secondary);"></span>
        </div>
        <button id="branch-delete-button" class="branch-delete-button" disabled>
          Delete Selected Branches
        </button>
        <div id="branch-delete-status-container" style="display: none; flex-direction: row; align-items: center; gap: 10px; margin-top: 10px;">
            <div id="branch-delete-status" class="branch-delete-status" style="margin-top: 0; flex-grow: 1; text-align: left;"></div>
            <button id="branch-refresh-button" class="button-secondary" style="padding: 8px 12px;">Refresh</button>
        </div>
      </div>
    </div>
  `;
  featureDiv.insertAdjacentHTML('beforeend', toolHtml);

  // 2. Now that HTML is injected, run the original logic
  
  // Get DOM elements
  const branchList = document.getElementById("branch-list");
  const branchDeleteButton = document.getElementById("branch-delete-button");
  const branchDeleteStatus = document.getElementById("branch-delete-status");
  const branchSelectionCount = document.getElementById("branch-selection-count");
  const branchSelectNone = document.getElementById("branch-select-none");
  const branchRefreshButton = document.getElementById("branch-refresh-button");
  const branchDeleteStatusContainer = document.getElementById("branch-delete-status-container");
  
  // Helper function to show status messages
  function showStatus(message, type = 'info') {
    branchDeleteStatus.textContent = message;
    branchDeleteStatus.className = `branch-delete-status ${type}`;
    branchDeleteStatus.style.display = 'block';
    branchDeleteStatusContainer.style.display = 'flex';
    
    // Per user request, the status message and refresh button should remain visible
    // after a success or error, and not time out.
    if (type === 'success' || type === 'error') {
      branchRefreshButton.style.display = 'block';
    } else {
      branchRefreshButton.style.display = 'none';
    }
  }
  
  // Helper function to update selection count and button state
  function updateSelectionCount() {
    const checkedCount = branchList.querySelectorAll('input[type="checkbox"]:checked').length;
    
    branchSelectNone.style.display = checkedCount > 0 ? 'inline-block' : 'none';

    if (checkedCount === 0) {
      branchSelectionCount.textContent = '';
      branchDeleteButton.textContent = 'Delete Selected Branches';
      branchDeleteButton.disabled = true;
    } else if (checkedCount === 1) {
      branchSelectionCount.textContent = '1 branch selected';
      branchDeleteButton.textContent = 'Delete Selected Branch';
      branchDeleteButton.disabled = false;
    } else {
      branchSelectionCount.textContent = `${checkedCount} branches selected`;
      branchDeleteButton.textContent = 'Delete Selected Branches';
      branchDeleteButton.disabled = false;
    }
  }
  
  // Function to delete a branch
  async function deleteBranch(branchId, skipRefresh = false) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab.url || !activeTab.url.includes('bubble.') || !activeTab.url.includes('/page')) {
        throw new Error('Please open a Bubble editor page first');
      }
      
      const urlParams = new URLSearchParams(new URL(activeTab.url).search);
      const appId = urlParams.get('id');
      
      if (!appId) {
        throw new Error('Could not find app ID in the current page URL');
      }
      
      showStatus(`Deleting branch ${branchId}...`, 'info');
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        world: 'MAIN',
        func: (appId, branchId) => {
          return new Promise((resolve, reject) => {
            console.log('❤️ Executing branch deletion for version:', branchId);
            try {
              Lib().location.post("server://appeditor/delete_app_version", {
                appname: appId,
                app_version: branchId,
                soft_delete: true
              }, (err, res) => {
                const message = err ? `Error: ${err}` : `Successfully deleted version ${branchId}`;
                console.log('❤️', message);
                if (err) {
                  reject(err);
                } else {
                  resolve(res);
                }
              });
            } catch (error) {
              console.error('❤️ Error calling Lib():', error);
              reject(error.toString());
            }
          });
        },
        args: [appId, branchId]
      });
      
      if (results && results[0] && results[0].result) {
        showStatus(`Successfully deleted branch ${branchId}`, 'success');
        if (!skipRefresh) {
          await fetchVersions();
        }
        return true;
      } else {
        throw new Error('No response from deletion command');
      }
    } catch (error) {
      console.error('❤️ Error deleting branch:', error);
      showStatus(error.message || 'Failed to delete branch', 'error');
      return false;
    }
  }
  
  // Function to fetch available versions from the Bubble editor
  async function fetchVersions() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab.url || !activeTab.url.includes('bubble.') || !activeTab.url.includes('/page')) {
        branchList.innerHTML = '<div class="branch-list-loading">Please open a Bubble editor page to use this feature</div>';
        branchDeleteButton.disabled = true;
        return;
      }
      
      branchList.innerHTML = '<div class="branch-list-loading">Loading versions...</div>';
      updateSelectionCount();
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        world: 'MAIN',
        func: () => {
          try {
            if (typeof window.get_version_metadata === 'function') {
              return window.get_version_metadata(true);
            } else {
              throw new Error('get_version_metadata function not found');
            }
          } catch (error) {
            console.error('❤️ Error getting version metadata:', error);
            throw error;
          }
        }
      });
      
      if (results && results[0] && results[0].result) {
        const versions = results[0].result;
        
        // Filter out live, test, and deleted versions
        const availableVersions = Object.entries(versions)
          .filter(([key, data]) => {
            return key !== 'live' && 
                   key !== 'test' && 
                   !data.deleted && 
                   data.access_permitted !== false;
          })
          .map(([key, data]) => ({
            id: key,
            display: data.display || key,
            creator: data.user?.email || 'Unknown'
          }));
        
        branchList.innerHTML = '';
        
        if (availableVersions.length === 0) {
          branchList.innerHTML = '<div class="branch-list-loading">No deletable branches found</div>';
          branchDeleteButton.disabled = true;
        } else {
          availableVersions.forEach(version => {
            const item = document.createElement('div');
            item.className = 'branch-item';
            item.innerHTML = `
              <input type="checkbox" id="branch-${version.id}" value="${version.id}">
              <label for="branch-${version.id}" class="branch-item-content">
                <div>
                  <span class="branch-item-name">${version.display}</span>
                  <span class="branch-item-id">(${version.id})</span>
                </div>
                <div class="branch-item-info">Created by: ${version.creator}</div>
              </label>
            `;
            
            const checkbox = item.querySelector('input[type="checkbox"]');
            const label = item.querySelector('label');

            // Add change handler to checkbox
            checkbox.addEventListener('change', (e) => {
              if (e.target.checked) {
                item.classList.add('selected');
              } else {
                item.classList.remove('selected');
              }
              updateSelectionCount();
            });

            // Make the whole item clickable and stop propagation
            item.addEventListener('click', (e) => {
              e.stopPropagation(); // Stop the click from bubbling up to the feature card

              // If the click was on the checkbox or label, the browser handles the toggle.
              // We only need to manually toggle if the click was on the item's padding.
              if (e.target !== checkbox && !label.contains(e.target)) {
                  checkbox.checked = !checkbox.checked;
                  checkbox.dispatchEvent(new Event('change'));
              }
            });

            branchList.appendChild(item);
          });
          
          updateSelectionCount();
        }
      } else {
        throw new Error('Failed to fetch version metadata');
      }
    } catch (error) {
      console.error('❤️ Error fetching versions:', error);
      branchList.innerHTML = `<div class="branch-list-loading">Error: ${error.message}</div>`;
      branchDeleteButton.disabled = true;
    }
  }
  
  // Event Listeners
  branchDeleteButton.addEventListener("click", async () => {
    const selectedCheckboxes = Array.from(branchList.querySelectorAll('input[type="checkbox"]:checked'));
    const selectedBranches = selectedCheckboxes.map(cb => cb.value);
    
    if (selectedBranches.length === 0) return;
    
    const confirmMessage = selectedBranches.length === 1 
      ? `Are you sure you want to delete branch "${selectedCheckboxes[0].parentElement.querySelector('.branch-item-name').textContent}"?`
      : `Are you sure you want to delete ${selectedBranches.length} branches?`;
    
    if (!confirm(confirmMessage)) return;
    
    // Hide delete button and disable other controls during deletion
    branchDeleteButton.style.display = 'none';
    branchSelectNone.disabled = true;
    selectedCheckboxes.forEach(cb => cb.disabled = true);
    
    if (selectedBranches.length === 1) {
      // Single branch deletion
      const success = await deleteBranch(selectedBranches[0]);
      if (success) {
        await fetchVersions();
      }
    } else {
      // Multiple branch deletion
      showStatus(`Deleting ${selectedBranches.length} branches...`, 'info');
      let successCount = 0;
      let failedBranches = [];
      
      for (let i = 0; i < selectedBranches.length; i++) {
        const branchId = selectedBranches[i];
        showStatus(`Deleting branch ${i + 1} of ${selectedBranches.length}: ${branchId}...`, 'info');
        
        const success = await deleteBranch(branchId, true); // Skip individual refreshes
        if (success) {
          successCount++;
        } else {
          failedBranches.push(branchId);
        }
      }
      
      // Show summary
      if (failedBranches.length === 0) {
        showStatus(`Successfully deleted all ${successCount} branches`, 'success');
      } else {
        showStatus(`Deleted ${successCount} branches. Failed: ${failedBranches.join(', ')}`, 'error');
      }
      
      // Refresh the list once after all deletions
      await fetchVersions();
    }
    
    // Re-enable controls
    branchSelectNone.disabled = false;
  });
  
  branchRefreshButton.addEventListener("click", async (e) => {
    e.stopPropagation(); // Prevent this click from bubbling up and toggling the feature's main checkbox
    
    // Reload parent tab
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.id) {
            chrome.tabs.reload(activeTab.id);
        }
    } catch (error) {
        console.error("❤️ Error reloading parent tab:", error);
    }

    // Reload popup
    window.location.reload();
  });
  
  branchSelectNone.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent this click from bubbling up and toggling the feature's main checkbox
    const checkboxes = branchList.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
      cb.checked = false;
      cb.dispatchEvent(new Event('change'));
    });
  });
  
  // Initial load
  fetchVersions();
  
})();