document.addEventListener("DOMContentLoaded", async () => {
  // Default preferences in case nothing is saved yet
  const response = await fetch(chrome.runtime.getURL("features.json"));
  const features = await response.json();

  const defaults = features.reduce((acc, feature) => {
    acc[feature.key] = feature.default;
    return acc;
  }, {});
  // Retrieve existing preferences or use defaults
  const prefs = await new Promise(resolve => {
    chrome.storage.sync.get(defaults, resolve);
  });
  
  // Track original preferences to detect changes
  const originalPrefs = JSON.parse(JSON.stringify(prefs));
  // Track whether changes have been made
  let changesMade = false;

  const container = document.getElementById("features-list");

  const categories = ["Expressions", "Expression Composers", "Branches", "Top Menubar", "Sidebar", "Style Tab", "Design Canvas", "Data View", "Workflow View", "Example Feature"];

  // Group features by categories
  const featuresByCategory = features.reduce((acc, feature) => {
    const category = feature.category || "Uncategorized"; // Default to "Uncategorized" if no category is specified
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {});

  const isDependencySatisfied = (feature, prefs) => {
    if (!feature.requires) return true; // No dependency
    return !!prefs[feature.requires];  // Dependency is enabled
  };

  // Function to check if a feature is a sub-feature (has a parent)
  const isSubFeature = (feature) => {
    return !!feature.requires;
  };

  // Function to get all sub-features for a given parent feature
  const getSubFeatures = (parentFeatureKey) => {
    return features.filter(f => f.requires === parentFeatureKey);
  };
  
  // Function to create input fields based on feature config
  const createFeatureInputs = (feature, containerDiv, isVisible = true) => {
    if (!feature.config || !feature.config.inputs || !feature.config.inputs.length) {
      return;
    }
    
    feature.config.inputs.forEach(inputConfig => {
      // Get the stored value or use default
      chrome.storage.sync.get([inputConfig.key], function(result) {
        const value = result[inputConfig.key] !== undefined ? result[inputConfig.key] : inputConfig.default;
        
        // Create input container
        const inputContainer = document.createElement("div");
        inputContainer.className = "input-container";
        inputContainer.style.display = isVisible ? "flex" : "none";
        
        // Create label for input
        const inputLabel = document.createElement("label");
        inputLabel.textContent = `${inputConfig.label}: `;
        inputLabel.className = "input-label";
        
        // Create input element based on type
        const input = document.createElement("input");
        input.className = "input-field";
        input.id = inputConfig.key;
        
        // Set input attributes based on type
        switch (inputConfig.type) {
          case "number":
            input.type = "number";
            if (inputConfig.min !== undefined) input.min = inputConfig.min;
            if (inputConfig.max !== undefined) input.max = inputConfig.max;
            input.value = value;
            break;
          case "text":
            input.type = "text";
            input.value = value;
            break;
          case "checkbox":
            input.type = "checkbox";
            input.checked = value;
            break;
          default:
            input.type = "text";
            input.value = value;
        }
        
        // Add event listener to input
        input.addEventListener("change", () => {
          // Store the value in chrome.storage
          const newValue = input.type === "checkbox" ? input.checked :
                          input.type === "number" ? parseInt(input.value, 10) :
                          input.value;
          
          const storageUpdate = {};
          storageUpdate[inputConfig.key] = newValue;
          chrome.storage.sync.set(storageUpdate);
          
          changesMade = true;
          saveButton.style.display = "block";
        });
        
        // Append elements to container
        inputContainer.appendChild(inputLabel);
        inputContainer.appendChild(input);
        containerDiv.appendChild(inputContainer);
      });
    });
  };

  // Function to create a feature card (works for both main features and sub-features)
  const createFeatureCard = (feature, isSubFeature = false, parentFeature = null) => {
    const div = document.createElement("div");
    div.className = isSubFeature ? "feature sub-feature" : "feature";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = prefs[feature.key];
    checkbox.id = feature.key;

    // Determine if checkbox should be disabled
    let isDisabled = false;
    if (isSubFeature && parentFeature) {
      // Sub-feature is disabled if parent is not checked
      isDisabled = !prefs[parentFeature.key];
      if (isDisabled) {
        checkbox.title = `Requires "${parentFeature.name}" to be enabled.`;
      }
    } else if (!isDependencySatisfied(feature, prefs)) {
      // Main feature is disabled if its dependency is not satisfied
      isDisabled = true;
      checkbox.title = `Requires "${features.find(f => f.key === feature.requires)?.name || feature.requires}" to be enabled.`;
    }

    if (isDisabled) {
      checkbox.disabled = true;
      div.classList.add("disabled");
    }

    // Create label and description
    const label = document.createElement("label");
    const labelText = document.createElement("span");
    labelText.textContent = feature.name;
    label.append(checkbox, labelText);
    div.appendChild(label);

    const description = document.createElement("p");
    description.textContent = feature.description;
    div.appendChild(description);
    
    // Add event listeners to the checkbox
    if (!isDisabled) {
      // Make the card clickable
      makeCardClickable(div, checkbox);
      
      // Add change event listeners for dependency handling and change tracking
      checkbox.addEventListener("change", () => {
        updateDependentFeatures(feature, checkbox.checked);
        checkForChanges();
        
        // Handle feature input visibility
        if (feature.config && feature.config.inputs) {
          const inputContainers = div.querySelectorAll('.input-container');
          if (inputContainers.length > 0) {
            inputContainers.forEach(container => {
              container.style.display = checkbox.checked ? "flex" : "none";
            });
          } else if (checkbox.checked) {
            // Create the input fields if they don't exist yet
            createFeatureInputs(feature, div);
          }
        }
      });
      
      // Add input fields for features with config
      if (feature.config && feature.config.inputs) {
        createFeatureInputs(feature, div, checkbox.checked);
      }
    }

    return { div, checkbox };
  };

  // Function to handle click events for feature cards
  const makeCardClickable = (div, checkbox) => {
    div.style.cursor = "pointer";
    div.addEventListener("click", (event) => {
      // Prevent default behavior for label and span elements
      if (event.target.tagName === 'LABEL' ||
          (event.target.tagName === 'SPAN' && event.target.parentElement && event.target.parentElement.tagName === 'LABEL')) {
        event.preventDefault();
      }
      
      // Stop propagation to prevent double-toggling
      event.stopPropagation();
      
      // Don't toggle if clicking on an input field or its label
      if (event.target.tagName === 'INPUT' ||
          (event.target.tagName === 'LABEL' && event.target.closest('.input-container')) ||
          event.target.closest('.input-container')) {
        return;
      }
      
      // Handle checkbox clicks
      if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
        // Let the default checkbox behavior handle this
        return;
      } else if (div.contains(event.target)) {
        // Toggle the checkbox
        checkbox.checked = !checkbox.checked;
        // Trigger change event
        checkbox.dispatchEvent(new Event("change"));
      }
    });
  };

  // Display features by category in the defined order
  categories.forEach((category) => {
    if (featuresByCategory[category]) {
      // Create category header
      const categoryHeader = document.createElement("h2");
      categoryHeader.textContent = category;
      container.appendChild(categoryHeader);

      // Iterate through features in the category
      featuresByCategory[category].forEach((feature) => {
        // Skip sub-features as they will be handled with their parent
        if (isSubFeature(feature)) return;

        // Create the main feature card
        const { div, checkbox } = createFeatureCard(feature);
        container.appendChild(div);

        // Check if this feature has sub-features
        const subFeatures = getSubFeatures(feature.key);
        if (subFeatures.length > 0) {
          // Create a container for sub-features
          const subFeaturesContainer = document.createElement("div");
          subFeaturesContainer.className = "sub-features";
          
          // Add each sub-feature
          subFeatures.forEach(subFeature => {
            const { div: subDiv } = createFeatureCard(subFeature, true, feature);
            subFeaturesContainer.appendChild(subDiv);
          });

          container.appendChild(subFeaturesContainer);
        }
      });
    }

    // Event listeners for checkboxes are now added in the createFeatureCard function
  });

  // Function to update dependent features when a parent feature's state changes
  function updateDependentFeatures(parentFeature, isParentChecked) {
    // Find all features that depend on this one
    const dependentFeatures = features.filter(f => f.requires === parentFeature.key);
    
    dependentFeatures.forEach(dependentFeature => {
      const dependentCheckbox = document.getElementById(dependentFeature.key);
      if (!dependentCheckbox) return;
      
      // Find the feature card div
      const dependentFeatureDiv = dependentCheckbox.closest('.feature');
      if (!dependentFeatureDiv) return;
      
      if (!isParentChecked) {
        // Parent is unchecked, so disable and uncheck the dependent feature
        dependentCheckbox.disabled = true;
        dependentCheckbox.checked = false;
        dependentCheckbox.title = `Requires "${parentFeature.name}" to be enabled.`;
        dependentFeatureDiv.classList.add('disabled');
        dependentFeatureDiv.style.cursor = 'not-allowed';
        
        // Remove click event listeners by replacing the element
        const newElement = dependentFeatureDiv.cloneNode(true);
        dependentFeatureDiv.parentNode.replaceChild(newElement, dependentFeatureDiv);
        
        // Make sure the checkbox keeps its ID
        const newCheckbox = newElement.querySelector('input[type="checkbox"]');
        if (newCheckbox) {
          newCheckbox.id = dependentFeature.key;
        }
        
        // Recursively update features that depend on this one
        updateDependentFeatures(dependentFeature, false);
      } else {
        // Parent is checked, so re-enable the dependent feature
        dependentCheckbox.disabled = false;
        dependentCheckbox.title = "";
        dependentFeatureDiv.classList.remove('disabled');
        
        // Recreate the feature card to restore click functionality
        const parentContainer = dependentFeatureDiv.parentNode;
        const isSubFeature = dependentFeatureDiv.classList.contains('sub-feature');
        const { div: newFeatureDiv, checkbox: newCheckbox } = createFeatureCard(
          dependentFeature,
          isSubFeature,
          isSubFeature ? features.find(f => f.key === dependentFeature.requires) : null
        );
        
        // Event listeners are added in the createFeatureCard function
        
        // Replace the old element with the new one
        parentContainer.replaceChild(newFeatureDiv, dependentFeatureDiv);
      }
    });
  }

  // Check for undefined categories
  Object.keys(featuresByCategory).forEach((category) => {
    if (!categories.includes(category)) {
      // Category not in defined categories array
    }
  });

  const notificationStatus = document.getElementById("status");
  const refreshSection = document.getElementById("refreshSection");
  const refreshButton = document.getElementById("refresh-button");
  const refreshAllButton = document.getElementById("refresh-all-button");
  const saveButton = document.getElementById("save-button");
  
  // Initially hide the save button since no changes have been made yet
  saveButton.style.display = "none";
  
  // Function to check if current preferences differ from original
  const checkForChanges = () => {
    const currentPrefs = {};
    features.forEach(feature => {
      const checkbox = document.getElementById(feature.key);
      if (checkbox) {
        currentPrefs[feature.key] = checkbox.checked;
      }
    });
    
    // Compare current preferences with original
    for (const key in currentPrefs) {
      if (currentPrefs[key] !== originalPrefs[key]) {
        changesMade = true;
        saveButton.style.display = "block";
        return;
      }
    }
    
    // No changes detected
    changesMade = false;
    saveButton.style.display = "none";
  };
  
  // Change event listeners are now added in the createFeatureCard function

  // close popup
  const closePopup = (delay = 0) => {
    setTimeout(() => {
      if (notificationStatus) {
        notificationStatus.style.display = "none";
      }
      if (refreshSection) {
        refreshSection.style.display = "none";
      }
      window.close();
    }, delay);
  };

  // Save button updates preferences in chrome.storage.sync
  document.getElementById("save-button").addEventListener("click", async () => {
    // Dynamically construct newPrefs object
    const newPrefs = {};
    features.forEach(feature => {
      const checkbox = document.getElementById(feature.key);
      if (checkbox) {
        newPrefs[feature.key] = checkbox.checked;
      }
    });

    // Store updated preferences
    await new Promise(resolve => {
      chrome.storage.sync.set(newPrefs, resolve);
    });
    
    // Update original preferences to match the newly saved ones
    Object.assign(originalPrefs, newPrefs);
    
    // Reset change tracking
    changesMade = false;
    saveButton.style.display = "none";
    
    if (notificationStatus) {
      notificationStatus.textContent = "Options saved! Please reload editor tabs for changes to take effect.";
      notificationStatus.style.display = "block";
    }
    if (refreshSection) {
      refreshSection.style.display = "flex";
    }
  });

  // Reload tab
  refreshButton.addEventListener("click", async () => {
    chrome.tabs.reload();
    closePopup(1500);
  });
  // Reload all Bubble.io and Bubble.is tabs
  refreshAllButton.addEventListener("click", async () => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url && (tab.url.includes("bubble.io") || tab.url.includes("bubble.is"))) {
          console.log(`❤️ Reloading tab: ${tab.url}`);
          chrome.tabs.reload(tab.id);
        }
      });
    });
    closePopup(1500);
  });

  // Fast Branch Delete functionality
  const branchDeleteSelect = document.getElementById("branch-delete-select");
  const branchDeleteButton = document.getElementById("branch-delete-button");
  const branchRefreshButton = document.getElementById("branch-refresh-button");
  const branchDeleteStatus = document.getElementById("branch-delete-status");
  
  // Function to execute branch deletion in the active tab
  async function deleteBranch(branchId) {
    try {
      // Get the active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if the active tab is a Bubble editor
      if (!activeTab.url || (!activeTab.url.includes("bubble.io") && !activeTab.url.includes("bubble.is"))) {
        throw new Error("Please open a Bubble editor tab first");
      }
      
      // Extract app ID from the URL
      const urlParams = new URLSearchParams(new URL(activeTab.url).search);
      const appId = urlParams.get('id');
      
      if (!appId) {
        throw new Error("No app ID found in the current tab URL");
      }
      
      // Execute the deletion script in the active tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        world: 'MAIN',  // This ensures the script runs in the page's main world where Lib() is available
        func: (appId, branchId) => {
          return new Promise((resolve, reject) => {
            console.log('❤️ Executing branch deletion for version:', branchId);
            
            // Now we can directly access Lib() since we're in the MAIN world
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
      
      console.log('❤️ Script execution results:', results);
      
      if (results && results[0]) {
        if (results[0].error) {
          throw new Error(results[0].error);
        } else {
          showStatus(`Successfully deleted branch: ${branchId}`, 'success');
          // Refresh the versions list after successful deletion
          await fetchVersions();
        }
      } else {
        throw new Error('No response from script execution');
      }
    } catch (error) {
      showStatus(error.message || 'Error deleting branch', 'error');
      console.error('❤️ Branch deletion error:', error);
    }
  }
  
  // Function to show status messages
  function showStatus(message, type) {
    branchDeleteStatus.textContent = message;
    branchDeleteStatus.className = `branch-delete-status ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        branchDeleteStatus.className = 'branch-delete-status';
        branchDeleteStatus.textContent = '';
      }, 5000);
    }
  }
  
  // Function to fetch versions from the active tab
  async function fetchVersions() {
    try {
      // Get the active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if the active tab is a Bubble editor
      if (!activeTab.url || (!activeTab.url.includes("bubble.io") && !activeTab.url.includes("bubble.is"))) {
        branchDeleteSelect.innerHTML = '<option value="">Please open a Bubble editor tab</option>';
        branchDeleteSelect.disabled = true;
        branchDeleteButton.disabled = true;
        return;
      }
      
      // Execute the script to get versions
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        world: 'MAIN',
        func: () => {
          try {
            console.log('❤️ Fetching version metadata');
            const versions = window.get_version_metadata(true);
            console.log('❤️ Version metadata:', versions);
            return versions;
          } catch (error) {
            console.error('❤️ Error fetching versions:', error);
            throw error;
          }
        }
      });
      
      if (results && results[0] && results[0].result) {
        const versions = results[0].result;
        
        // Filter out deleted versions and system versions (live, test)
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
        
        // Clear and populate the select dropdown
        branchDeleteSelect.innerHTML = '';
        
        if (availableVersions.length === 0) {
          branchDeleteSelect.innerHTML = '<option value="">No deletable branches found</option>';
          branchDeleteSelect.disabled = true;
          branchDeleteButton.disabled = true;
        } else {
          branchDeleteSelect.innerHTML = '<option value="">Select a branch to delete</option>';
          
          availableVersions.forEach(version => {
            const option = document.createElement('option');
            option.value = version.id;
            option.textContent = `${version.display} (${version.id})`;
            branchDeleteSelect.appendChild(option);
          });
          
          branchDeleteSelect.disabled = false;
          branchDeleteButton.disabled = false;
        }
      }
    } catch (error) {
      console.error('❤️ Error fetching versions:', error);
      branchDeleteSelect.innerHTML = '<option value="">Error loading versions</option>';
      branchDeleteSelect.disabled = true;
      branchDeleteButton.disabled = true;
      showStatus('Error loading versions: ' + error.message, 'error');
    }
  }
  
  // Add click event listener to the delete button
  branchDeleteButton.addEventListener("click", async () => {
    const branchId = branchDeleteSelect.value;
    
    if (!branchId) {
      showStatus('Please select a branch to delete', 'error');
      return;
    }
    
    // Get the selected option text for confirmation
    const selectedOption = branchDeleteSelect.options[branchDeleteSelect.selectedIndex];
    const branchName = selectedOption.textContent;
    
    // Confirm deletion
    if (confirm(`Are you sure you want to delete the branch "${branchName}"?`)) {
      await deleteBranch(branchId);
    }
  });
  
  // Add click event listener to the refresh button
  branchRefreshButton.addEventListener("click", async () => {
    branchDeleteSelect.innerHTML = '<option value="">Loading versions...</option>';
    branchDeleteSelect.disabled = true;
    branchDeleteButton.disabled = true;
    await fetchVersions();
  });
  
  // Enable/disable delete button based on selection
  branchDeleteSelect.addEventListener("change", () => {
    branchDeleteButton.disabled = !branchDeleteSelect.value;
  });
  
  // Fetch versions on initial load
  fetchVersions();

  // click close button
  document.getElementById("close-button").addEventListener("click", async () => {
    closePopup();
  });
});
