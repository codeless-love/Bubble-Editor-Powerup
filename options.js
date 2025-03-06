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

  const container = document.getElementById("features-list");

  const categories = ["Expressions", "Expression Composers", "Branches", "Sidebar", "Style Tab", "Design Canvas", "Data View", "Workflow View"];

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
            // Debug logging
            console.log("❤️ Feature card clicked:", feature.name);
            console.log("❤️ Event target:", event.target.tagName, event.target.className);
            console.log("❤️ Event target text:", event.target.textContent);
            
            // The issue is that clicks on label elements automatically trigger clicks on the associated checkbox
            // We need to prevent this default behavior for label and span elements
            if (event.target.tagName === 'LABEL' ||
                (event.target.tagName === 'SPAN' && event.target.parentElement && event.target.parentElement.tagName === 'LABEL')) {
              console.log("❤️ Preventing default behavior for label/span click");
              event.preventDefault(); // Prevent the default behavior (clicking the checkbox)
            }
            
            // Stop propagation to prevent double-toggling
            event.stopPropagation();
            
            // Let's check if the click is on the checkbox itself, and if not, toggle the checkbox
            if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
              console.log("❤️ Direct checkbox click, letting default behavior handle it");
              // Let the default checkbox behavior handle this
              return;
            } else if (div.contains(event.target)) {
              // For any other element within the div (including label, span, p), toggle the checkbox
              console.log("❤️ Toggling feature checkbox for:", feature.name);
              checkbox.checked = !checkbox.checked;
              // Trigger the change event to update dependent features
              checkbox.dispatchEvent(new Event("change"));
            } else {
              console.log("❤️ Click did not trigger toggle for:", feature.name);
              console.log("❤️ Is in div?", div.contains(event.target));
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
                // Debug logging
                console.log("❤️ Subfeature card clicked:", subFeature.name);
                console.log("❤️ Event target:", event.target.tagName, event.target.className);
                console.log("❤️ Event target text:", event.target.textContent);
                
                // The issue is that clicks on label elements automatically trigger clicks on the associated checkbox
                // We need to prevent this default behavior for label and span elements
                if (event.target.tagName === 'LABEL' ||
                    (event.target.tagName === 'SPAN' && event.target.parentElement && event.target.parentElement.tagName === 'LABEL')) {
                  console.log("❤️ Preventing default behavior for label/span click in subfeature");
                  event.preventDefault(); // Prevent the default behavior (clicking the checkbox)
                }
                
                // Stop propagation to prevent double-toggling
                event.stopPropagation();
                
                // Apply the same fix as for feature cards
                if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
                  console.log("❤️ Direct checkbox click on subfeature, letting default behavior handle it");
                  // Let the default checkbox behavior handle this
                  return;
                } else if (subDiv.contains(event.target)) {
                  // For any other element within the div (including label, span, p), toggle the checkbox
                  console.log("❤️ Toggling subfeature checkbox for:", subFeature.name);
                  subCheckbox.checked = !subCheckbox.checked;
                  // Trigger change event to ensure proper state update
                  subCheckbox.dispatchEvent(new Event('change'));
                } else {
                  console.log("❤️ Click did not trigger toggle for subfeature:", subFeature.name);
                  console.log("❤️ Is in div?", subDiv.contains(event.target));
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
                  // Enable the feature card
                  dependentFeatureDiv.classList.remove('disabled');
                  dependentFeatureDiv.style.cursor = 'pointer';
                  
                  // Add click event listener back
                  dependentFeatureDiv.addEventListener('click', (event) => {
                    // Debug logging for dependent features
                    const dependentFeature = features.find(feat => feat.key === f.key);
                    console.log("❤️ Dependent feature card clicked:", dependentFeature ? dependentFeature.name : f.key);
                    console.log("❤️ Event target:", event.target.tagName, event.target.className);
                    console.log("❤️ Event target text:", event.target.textContent);
                    
                    // Stop propagation to prevent double-toggling
                    event.stopPropagation();
                    
                    const clickedCheckbox = dependentFeatureDiv.querySelector('input[type="checkbox"]');
                    // Apply the same fix as for feature and subfeature cards
                    if (event.target.tagName === 'INPUT' && event.target.type === 'checkbox') {
                      console.log("❤️ Direct checkbox click on dependent feature, letting default behavior handle it");
                      // Let the default checkbox behavior handle this
                      return;
                    } else if (dependentFeatureDiv.contains(event.target) && !clickedCheckbox.disabled) {
                      // For any other element within the div (including label, span, p), toggle the checkbox
                      console.log("❤️ Toggling dependent feature checkbox for:", dependentFeature ? dependentFeature.name : f.key);
                      clickedCheckbox.checked = !clickedCheckbox.checked;
                      clickedCheckbox.dispatchEvent(new Event('change'));
                    } else {
                      console.log("❤️ Click did not trigger toggle for dependent feature:", dependentFeature ? dependentFeature.name : f.key);
                      console.log("❤️ Is in div?", dependentFeatureDiv.contains(event.target));
                      console.log("❤️ Is checkbox disabled?", clickedCheckbox.disabled);
                    }
                  });
                }
              }
            }
          }
        });

        // Special handling for the expression_bad_practice_warning feature
        if (feature.key === "expression_bad_practice_warning") {
          // Get all sub-features
          const countIsZeroCheckbox = document.getElementById("expression_bad_practice_warning_count_is_zero");
          const currentUserCheckbox = document.getElementById("expression_bad_practice_warning_current_user_in_backend");
          
          // Enable/disable based on parent state
          if (countIsZeroCheckbox) {
            const countIsZeroDiv = countIsZeroCheckbox.closest('.feature');
            countIsZeroCheckbox.disabled = !checkbox.checked;
            
            if (countIsZeroDiv) {
              if (!checkbox.checked) {
                countIsZeroDiv.classList.add('disabled');
                countIsZeroDiv.style.cursor = 'not-allowed';
                countIsZeroCheckbox.checked = false;
              } else {
                countIsZeroDiv.classList.remove('disabled');
                countIsZeroDiv.style.cursor = 'pointer';
              }
            }
          }
          
          if (currentUserCheckbox) {
            const currentUserDiv = currentUserCheckbox.closest('.feature');
            currentUserCheckbox.disabled = !checkbox.checked;
            
            if (currentUserDiv) {
              if (!checkbox.checked) {
                currentUserDiv.classList.add('disabled');
                currentUserDiv.style.cursor = 'not-allowed';
                currentUserCheckbox.checked = false;
              } else {
                currentUserDiv.classList.remove('disabled');
                currentUserDiv.style.cursor = 'pointer';
              }
            }
          }
        }

        // Dynamically uncheck all dependent features if the requirement is unchecked
        uncheckDependentFeatures(feature, checkbox.checked);
      });
    });
  });

  // Function to uncheck dependent features
  function uncheckDependentFeatures(feature, isChecked) {
    features.forEach((f) => {
      if (f.requires === feature.key && !isChecked) {
        const dependentCheckbox = document.getElementById(f.key);
        if (dependentCheckbox) {
          // Find the parent feature div of the dependent checkbox
          const dependentFeatureDiv = dependentCheckbox.closest('.feature');
          
          if (dependentFeatureDiv) {
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
          } else {
            dependentCheckbox.checked = false; // Uncheck dependent feature
            dependentCheckbox.disabled = true;  // Disable it
          }
          
          // Recursively uncheck any features that depend on this one
          uncheckDependentFeatures(f, false);
        }
      }
    });
  }

  // Log any undefined categories to the console for debugging
  Object.keys(featuresByCategory).forEach((category) => {
    if (!categories.includes(category)) {
      console.warn("❤️"+`Category "${category}" is not in the defined categories array.`);
    }
  });

  const notificationStatus = document.getElementById("status");
  const refreshSection = document.getElementById("refreshSection");
  const refreshButton = document.getElementById("refresh-button");
  const refreshAllButton = document.getElementById("refresh-all-button");

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
    console.log("❤️"+"Save clicked.")
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
    if (notificationStatus) {
      notificationStatus.textContent = "Options saved! Please reload Bubble editor tabs for changes to take effect.";
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
  // Reload all Bubble.io tabs
  refreshAllButton.addEventListener("click", async () => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url && tab.url.includes("bubble.io")) {
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
