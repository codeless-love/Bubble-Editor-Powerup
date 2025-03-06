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

        const div = document.createElement("div");
        div.className = "feature";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = prefs[feature.key];
        checkbox.id = feature.key;

        // Disable checkbox if dependency is not satisfied
        if (!isDependencySatisfied(feature, prefs)) {
          checkbox.disabled = true;
          checkbox.title = `Requires "${features.find(f => f.key === feature.requires)?.name || feature.requires}" to be enabled.`;
          div.classList.add("disabled");
        }

        const label = document.createElement("label");
        const labelText = document.createElement("span");
        labelText.textContent = feature.name;
        label.append(checkbox, labelText);

        div.appendChild(label);

        const description = document.createElement("p");
        description.textContent = feature.description;
        div.appendChild(description);
        
        // Make the entire card clickable to toggle the checkbox
        if (!checkbox.disabled) {
          div.addEventListener("click", (event) => {
            // The issue is that clicks on label elements automatically trigger clicks on the associated checkbox
            // We need to prevent this default behavior for label and span elements
            if (event.target.tagName === 'LABEL' ||
                (event.target.tagName === 'SPAN' && event.target.parentElement && event.target.parentElement.tagName === 'LABEL')) {
              event.preventDefault(); // Prevent the default behavior (clicking the checkbox)
            }
            
            // Stop propagation to prevent double-toggling
            event.stopPropagation();
            
            // Let's check if the click is on the checkbox itself, and if not, toggle the checkbox
            if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
              // Let the default checkbox behavior handle this
              return;
            } else if (div.contains(event.target)) {
              // For any other element within the div (including label, span, p), toggle the checkbox
              checkbox.checked = !checkbox.checked;
              // Trigger the change event to update dependent features
              checkbox.dispatchEvent(new Event("change"));
            }
          });
          div.style.cursor = "pointer";
        }

        container.appendChild(div);

        // Check if this feature has sub-features
        const subFeatures = getSubFeatures(feature.key);
        if (subFeatures.length > 0) {
          // Create a container for sub-features
          const subFeaturesContainer = document.createElement("div");
          subFeaturesContainer.className = "sub-features";
          
          // Add each sub-feature
          subFeatures.forEach(subFeature => {
            const subDiv = document.createElement("div");
            subDiv.className = "feature sub-feature";

            const subCheckbox = document.createElement("input");
            subCheckbox.type = "checkbox";
            subCheckbox.checked = prefs[subFeature.key];
            subCheckbox.id = subFeature.key;
            
            // Disable sub-feature checkbox if parent is disabled
            if (!checkbox.checked) {
              subCheckbox.disabled = true;
              subCheckbox.title = `Requires "${feature.name}" to be enabled.`;
              subDiv.classList.add("disabled");
            }

            const subLabel = document.createElement("label");
            const subLabelText = document.createElement("span");
            subLabelText.textContent = subFeature.name;
            subLabel.append(subCheckbox, subLabelText);

            subDiv.appendChild(subLabel);

            const subDescription = document.createElement("p");
            subDescription.textContent = subFeature.description;
            subDiv.appendChild(subDescription);
            
            // Make the entire sub-feature card clickable to toggle the checkbox
            if (!subCheckbox.disabled) {
              subDiv.addEventListener("click", (event) => {
                // The issue is that clicks on label elements automatically trigger clicks on the associated checkbox
                // We need to prevent this default behavior for label and span elements
                if (event.target.tagName === 'LABEL' ||
                    (event.target.tagName === 'SPAN' && event.target.parentElement && event.target.parentElement.tagName === 'LABEL')) {
                  event.preventDefault(); // Prevent the default behavior (clicking the checkbox)
                }
                
                // Stop propagation to prevent double-toggling
                event.stopPropagation();
                
                // Apply the same fix as for feature cards
                if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
                  // Let the default checkbox behavior handle this
                  return;
                } else if (subDiv.contains(event.target)) {
                  // For any other element within the div (including label, span, p), toggle the checkbox
                  subCheckbox.checked = !subCheckbox.checked;
                  // Trigger change event to ensure proper state update
                  subCheckbox.dispatchEvent(new Event('change'));
                }
              });
              subDiv.style.cursor = "pointer";
            }

            subFeaturesContainer.appendChild(subDiv);
          });

          container.appendChild(subFeaturesContainer);
        }
      });
    }

    // Add event listeners to update dependent features dynamically
    features.forEach((feature) => {
      const checkbox = document.getElementById(feature.key);
      if (!checkbox) return;

      checkbox.addEventListener("change", () => {
        // Update dependent features
        features.forEach((f) => {
          if (f.requires === feature.key) {
            const dependentCheckbox = document.getElementById(f.key);
            if (dependentCheckbox) {
              const enabled = checkbox.checked;
              dependentCheckbox.disabled = !enabled;
              dependentCheckbox.title = enabled
                ? ""
                : `Requires "${feature.name}" to be enabled.`;
              
              // Find the parent feature div of the dependent checkbox
              const dependentFeatureDiv = dependentCheckbox.closest('.feature');
              if (dependentFeatureDiv) {
                if (!enabled) {
                  // Disable the feature card
                  dependentFeatureDiv.classList.add('disabled');
                  dependentFeatureDiv.style.cursor = 'not-allowed';
                  
                  // Remove any existing click event listeners
                  const oldElement = dependentFeatureDiv;
                  const newElement = oldElement.cloneNode(true);
                  oldElement.parentNode.replaceChild(newElement, oldElement);
                  
                  // Make sure the checkbox is still accessible in the DOM
                  const newCheckbox = newElement.querySelector('input[type="checkbox"]');
                  if (newCheckbox) {
                    newCheckbox.id = dependentCheckbox.id;
                    newCheckbox.checked = false; // Uncheck if disabled
                    newCheckbox.disabled = true;
                  }
                } else {
                  // When re-enabling a feature, we need to completely recreate the subfeature card
                  // to ensure all event listeners work properly
                  
                  // First, get the parent container
                  const parentContainer = dependentFeatureDiv.parentNode;
                  
                  // Create a new div for the subfeature
                  const newSubFeatureDiv = document.createElement('div');
                  newSubFeatureDiv.className = 'feature sub-feature';
                  
                  // Create a new checkbox
                  const newSubCheckbox = document.createElement('input');
                  newSubCheckbox.type = 'checkbox';
                  newSubCheckbox.id = f.key;
                  newSubCheckbox.checked = false; // Start unchecked
                  
                  // Create label and text
                  const newSubLabel = document.createElement('label');
                  const newSubLabelText = document.createElement('span');
                  const subFeature = features.find(feat => feat.key === f.key);
                  newSubLabelText.textContent = subFeature ? subFeature.name : f.key;
                  newSubLabel.append(newSubCheckbox, newSubLabelText);
                  
                  // Add description
                  const newSubDescription = document.createElement('p');
                  newSubDescription.textContent = subFeature ? subFeature.description : '';
                  
                  // Assemble the new div
                  newSubFeatureDiv.appendChild(newSubLabel);
                  newSubFeatureDiv.appendChild(newSubDescription);
                  
                  // Make the entire card clickable
                  newSubFeatureDiv.style.cursor = 'pointer';
                  newSubFeatureDiv.addEventListener('click', (event) => {
                    // Prevent default behavior for label and span elements
                    if (event.target.tagName === 'LABEL' ||
                        (event.target.tagName === 'SPAN' && event.target.parentElement && event.target.parentElement.tagName === 'LABEL')) {
                      event.preventDefault();
                    }
                    
                    // Stop propagation to prevent double-toggling
                    event.stopPropagation();
                    
                    // Handle checkbox clicks
                    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
                      // Let the default checkbox behavior handle this
                      return;
                    } else if (newSubFeatureDiv.contains(event.target)) {
                      // Toggle the checkbox
                      newSubCheckbox.checked = !newSubCheckbox.checked;
                      newSubCheckbox.dispatchEvent(new Event('change'));
                    }
                  });
                  
                  // Add change event listener to the checkbox
                  newSubCheckbox.addEventListener('change', checkForChanges);
                  
                  // Replace the old element with the new one
                  parentContainer.replaceChild(newSubFeatureDiv, dependentFeatureDiv);
                }
              }
            }
          }
        });

        // Dynamically uncheck all dependent features if the requirement is unchecked
        uncheckDependentFeatures(feature, checkbox.checked);
      });
    });
  });

  // Function to uncheck dependent features
  function uncheckDependentFeatures(feature, isChecked) {
    features.forEach((f) => {
      if (f.requires === feature.key) {
        const dependentCheckbox = document.getElementById(f.key);
        if (dependentCheckbox) {
          // Find the parent feature div of the dependent checkbox
          const dependentFeatureDiv = dependentCheckbox.closest('.feature');
          
          if (dependentFeatureDiv) {
            if (!isChecked) {
              // Disable the feature card
              dependentFeatureDiv.classList.add('disabled');
              dependentFeatureDiv.style.cursor = 'not-allowed';
              
              // Remove any existing click event listeners
              const oldElement = dependentFeatureDiv;
              const newElement = oldElement.cloneNode(true);
              oldElement.parentNode.replaceChild(newElement, oldElement);
              
              // Make sure the checkbox is still accessible in the DOM
              const newCheckbox = newElement.querySelector('input[type="checkbox"]');
              if (newCheckbox) {
                newCheckbox.id = dependentCheckbox.id;
                newCheckbox.checked = false; // Uncheck dependent feature
                newCheckbox.disabled = true;  // Disable it
              }
              
              // Recursively uncheck any features that depend on this one
              uncheckDependentFeatures(f, false);
            }
          } else {
            if (!isChecked) {
              dependentCheckbox.checked = false; // Uncheck dependent feature
              dependentCheckbox.disabled = true;  // Disable it
              
              // Recursively uncheck any features that depend on this one
              uncheckDependentFeatures(f, false);
            }
          }
        }
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
  
  // Add change event listeners to all checkboxes to detect changes
  features.forEach(feature => {
    const checkbox = document.getElementById(feature.key);
    if (checkbox) {
      checkbox.addEventListener("change", checkForChanges);
    }
  });

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

  // click close button
  document.getElementById("close-button").addEventListener("click", async () => {
    closePopup();
  });
});
