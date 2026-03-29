// Fast Branch Delete functionality for the extension popup
// This module handles the UI and logic for deleting Bubble app branches

(function() {
  // Only run if we're on the popup page
  if (!document.getElementById("branch-list")) return;
  
  console.log("❤️ Fast Branch Delete module loaded");
  
  // Get DOM elements
  const branchList = document.getElementById("branch-list");
  const branchDeleteButton = document.getElementById("branch-delete-button");
  const branchRefreshButton = document.getElementById("branch-refresh-button");
  const branchDeleteStatus = document.getElementById("branch-delete-status");
  const branchSelectionCount = document.getElementById("branch-selection-count");
  const branchSelectNone = document.getElementById("branch-select-none");
  
  // Helper function to show status messages
  function showStatus(message, type = 'info') {
    branchDeleteStatus.textContent = message;
    branchDeleteStatus.className = `branch-delete-status ${type}`;
    branchDeleteStatus.style.display = 'block';
    
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        branchDeleteStatus.style.display = 'none';
      }, 5000);
    }
  }
  
  // Helper function to update selection count and button state
  function updateSelectionCount() {
    const checkedCount = branchList.querySelectorAll('input[type="checkbox"]:checked').length;
    
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
            
            // Add change handler to checkbox
            item.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
              if (e.target.checked) {
                item.classList.add('selected');
              } else {
                item.classList.remove('selected');
              }
              updateSelectionCount();
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
    
    // Disable controls during deletion
    branchDeleteButton.disabled = true;
    branchRefreshButton.disabled = true;
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
    branchDeleteButton.disabled = false;
    branchRefreshButton.disabled = false;
    branchSelectNone.disabled = false;
  });
  
  branchRefreshButton.addEventListener("click", async () => {
    branchList.innerHTML = '<div class="branch-list-loading">Refreshing...</div>';
    await fetchVersions();
  });
  
  branchSelectNone.addEventListener("click", () => {
    const checkboxes = branchList.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
      cb.checked = false;
      cb.dispatchEvent(new Event('change'));
    });
  });
  
  // Initial load
  fetchVersions();
  
})();