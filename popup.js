document.addEventListener("DOMContentLoaded", async () => {
  let candidateDomains = [];
  let approvedDomains = [];

  const contributors = {
    "example": { name: "Example Contributor", link: "https://codeless.love" },
    "brenton": { name: "Brenton Strine", link: "https://popcode.studio" },
    "rathan": { name: "Rathan A", link: "https://www.linkedin.com/in/rathan-the-builder/" },
    "rico": { name: "Rico Trevisan", link: "https://www.mocharymethod.com/team/rico-trevisan" },
    "george": { name: "George Collier", link: "https://notquiteunicorns.xyz/" },
    "tim": { name: "Timothy Tu", link: "https://community.buildcamp.io/u/b0c0b288" },
    "rafa": { name: "Rafa Chavantes", link: "https://rafa.chavantes.com/" },
    "thomas": { name: "Thomas Mey", link: "https://www.linkedin.com/in/thomas-mey-dev/", },
  };

  // Helper: Promisified chrome.storage.sync.get
  function getCandidateDomains() {
    return new Promise(resolve => {
      chrome.storage.sync.get({ candidateDomains: [] }, (result) => {
        resolve(result.candidateDomains || []);
      });
    });
  }

  // Helper: Promisified chrome.permissions.getAll
  function getApprovedDomains() {
    return new Promise(resolve => {
      chrome.permissions.getAll((perms) => {
        const domains = (perms.origins || [])
          .map(origin => {
            try {
              return origin.replace(/^https?:\/\//, '').replace(/\/$|\*$/, '').replace(/\/$/, '');
            } catch (e) { return origin; }
          })
          .filter(Boolean);
        resolve(domains);
      });
    });
  }

  // Wait for both candidateDomains and approvedDomains
  [candidateDomains, approvedDomains] = await Promise.all([
    getCandidateDomains(),
    getApprovedDomains()
  ]);

  // --- DOMAIN STATE LOGIC ---
  let domainState = "Unrelated";
  let currentDomain = "";
  let currentPath = "";
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].url) return;
    try {
      const url = new URL(tabs[0].url);
      currentDomain = url.hostname;
      currentPath = url.pathname;
      const isBubbleEditor = (currentDomain.endsWith("bubble.io") || currentDomain.endsWith("bubble.is")) && currentPath.startsWith("/page");
      const isBubbleMain = (currentDomain.endsWith("bubble.io") || currentDomain.endsWith("bubble.is"));
      const isBubbleApps = currentDomain.endsWith("bubbleapps.io");
      const isCandidate = candidateDomains.includes(currentDomain) && !approvedDomains.includes(currentDomain);
      const isApproved = approvedDomains.includes(currentDomain) || isBubbleApps;
      if (isBubbleEditor) {
        domainState = "Editor";
      } else if (isCandidate) {
        domainState = "Candidate";
      } else if (isBubbleApps) {
        domainState = "Approved";
      } else if (isApproved) {
        domainState = "Approved";
      } else if (isBubbleMain) {
        domainState = "Unrelated";
      } else {
        domainState = "Unrelated";
      }
    } catch (e) {
      domainState = "Unrelated";
    }

    // Toggle <main> visibility based on domainState
    const mainStates = ["Editor", "Candidate", "Approved", "Unrelated"];
    mainStates.forEach(state => {
      const main = document.getElementById(state);
      if (main) main.hidden = (state !== domainState);
    });

    // Conditionally hide the toolbar if not in editor view
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
      toolbar.hidden = (domainState !== 'Editor');
    }

    // --- Grant access button logic (moved here for correct scope) ---
    const grantBtn = document.getElementById("grant-access-btn");
    if (grantBtn) {
      console.log("Grant access button found, adding listener");
      grantBtn.addEventListener("click", async () => {
        console.log("Grant access button clicked");
        let domainToGrant = currentDomain;
        console.log("Domain to grant:", domainToGrant);
        if (!domainToGrant) {
          alert("Could not determine current domain.");
          return;
        }
        const origin = `https://${domainToGrant}/*`;
        console.log("Requesting permission for origin:", origin);
        chrome.permissions.request({ origins: [origin] }, (granted) => {
          console.log("Permission granted?", granted);
          if (granted) {
            window.location.reload();
          } else {
            alert("Permission was not granted.");
          }
        });
      });
    } else {
      console.log("Grant access button NOT found");
    }
    // --- End grant access logic ---
  });


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
  let applyFiltersRef = () => {};

  const container = document.getElementById("features-list");

  const categories = [
    "Runtime",
    "Editor Styling",
    "Expressions",
    "Expression Composers",
    "Property Editor",
    "Branches",
    "Top Menubar",
    "Sidebar",
    "Style Tab",
    "Design Canvas",
    "Data View",
    "Workflow View",
    "Search Palette",
    "Merge",
    "Example Feature"
  ];

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

    // Create contributors section
    if (feature.contributors && feature.contributors.length > 0) {
      const contributorsDiv = document.createElement("div");
      contributorsDiv.className = "contributors-section";

      const contributorLinks = feature.contributors
        .map(contribKey => {
          const contributorData = contributors[contribKey];
          if (contributorData) {
            return contributorData.link ? `<a href="${contributorData.link}" target="_blank" rel="noopener noreferrer">${contributorData.name}</a>` : `<span>${contributorData.name}</span>`;
          }
          return null;
        })
        .filter(Boolean)
        .join(', ');

      if (contributorLinks) {
        const label = feature.contributors.length === 1 ? 'Contributor' : 'Contributors';
        contributorsDiv.innerHTML = `<span>${label}:</span> ${contributorLinks}`;//text directly in the div has a taller height, so we keep height minimal by wrapping the label in 'span'
        div.appendChild(contributorsDiv);
      }
    }

    // Inject domains list for enable_runtime_features only
    if (feature.key === "enable_runtime_features") {
      const domainsContainer = document.createElement("div");
      domainsContainer.className = "candidate-domains";
      domainsContainer.textContent = "Loading domains...";
      div.appendChild(domainsContainer);
      if (candidateDomains.length === 0) {
        domainsContainer.textContent = "No eligible domains.";
      } else {
        const unapprovedCandidateDomains = candidateDomains.filter(domain => !approvedDomains.includes(domain));
        if (unapprovedCandidateDomains.length === 0) {
          domainsContainer.style.display = "none";
        } else {
          domainsContainer.textContent = "Domains waiting for approval:";
          const container = document.createElement("div");
          container.className = "candidate-domains-list";
          unapprovedCandidateDomains.forEach(domain => {
            const span = document.createElement("span");
            span.textContent = domain;
            container.appendChild(span);
          });
          domainsContainer.appendChild(container);
        }
      }
      // --- Approved domains list ---
      const approvedContainer = document.createElement("div");
      approvedContainer.className = "candidate-domains";
      approvedContainer.textContent = "Loading approved domains...";
      div.appendChild(approvedContainer);

      if (approvedDomains.length === 0) {
        approvedContainer.style.display = "none";
      } else {
        approvedContainer.textContent = "Approved domains:";
        const container = document.createElement("div");
        container.className = "candidate-domains-list";
        approvedDomains.forEach(domain => {
          const span = document.createElement("span");
          span.textContent = domain;
          container.appendChild(span);
        });
        approvedContainer.appendChild(container);
      }
    }

    // Add event listeners to the checkbox
    if (!isDisabled) {
      // Make the card clickable
      makeCardClickable(div, checkbox);

      // Add change event listeners for dependency handling and change tracking
      checkbox.addEventListener("change", () => {
        updateDependentFeatures(feature, checkbox.checked);
        prefs[feature.key] = checkbox.checked;
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

        const parentAccordion = div.closest(".accordion");
        if (parentAccordion) {
          updateCategoryCount(parentAccordion);
        }
        applyFiltersRef();
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

  function updateCategoryCount(accordion) {
    const cards = Array.from(accordion.querySelectorAll(".feature:not(.sub-feature)"));
    const total = cards.length;
    const enabledCount = cards.filter((card) => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        return checkbox && !checkbox.disabled && checkbox.checked;
    }).length;
    const countEl = accordion.querySelector(".category-count");
    if (countEl) {
      if (total > 0) {
        countEl.textContent = `(${enabledCount}/${total} features enabled)`;
      } else {
        countEl.textContent = "";
      }
    }
  }

  // Display features by category in the defined order
  categories.forEach((categoryName) => {
    const featureList = featuresByCategory[categoryName];
    if (featureList) {
      // Create category header
      const accordion = document.createElement("div");
      accordion.className = "accordion";
      accordion.dataset.state = "open"; // Start open by default
      accordion.dataset.category = categoryName;

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "accordion-trigger";
      trigger.setAttribute("aria-expanded", "true");

      const titleSpan = document.createElement("span");
      titleSpan.textContent = categoryName;

      const countSpan = document.createElement("span");
      countSpan.className = "category-count";
      
      trigger.appendChild(titleSpan);
      trigger.appendChild(countSpan);
      trigger.insertAdjacentHTML(
          "beforeend",
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
      );

      trigger.addEventListener("click", () => {
          const isOpen = accordion.dataset.state === "open";
          accordion.dataset.state = isOpen ? "closed" : "open";
          trigger.setAttribute("aria-expanded", String(!isOpen));
      });

      const content = document.createElement("div");
      content.className = "accordion-content";

      featureList.forEach((feature) => {
        // Skip sub-features as they will be handled with their parent
        if (isSubFeature(feature)) return;

        // Create the main feature card
        const { div, checkbox } = createFeatureCard(feature);
        content.appendChild(div);

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

          content.appendChild(subFeaturesContainer);
        }
      });

      if (content.children.length > 0) {
          accordion.appendChild(trigger);
          accordion.appendChild(content);
          container.appendChild(accordion);
          updateCategoryCount(accordion);
      }
    }
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
        prefs[dependentFeature.key] = false;
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
    let hasChanges = false;
    for (const key in originalPrefs) {
      if (prefs[key] !== originalPrefs[key]) {
        hasChanges = true;
        break;
      }
    }
    changesMade = hasChanges;
    saveButton.style.display = hasChanges ? "block" : "none";
  };

  // Change event listeners are now added in the createFeatureCard function
  if (changesMade) {
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
    // Store updated preferences
    await new Promise(resolve => {
      chrome.storage.sync.set(prefs, resolve);
    });

    // Update original preferences to match the newly saved ones
    Object.assign(originalPrefs, prefs);

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
    window.location.reload();
    closePopup(1500);
  });
  // Reload all Bubble and Bubble.is tabs
  refreshAllButton.addEventListener("click", async () => {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url && (tab.url.includes("bubble.io") || tab.url.includes("bubble.is"))) {
          console.log(`❤️ Reloading tab: ${tab.url}`);
          chrome.tabs.reload(tab.id);
          window.location.reload();
        }
      });
    });
    closePopup(1500);
  });


  // click close button
  document.getElementById("close-button").addEventListener("click", async () => {
    closePopup();
  });

  function setupFilters() {
    const searchInput = document.getElementById("feature-search");
    const filterBtns = document.querySelectorAll(".filter-button");
    let currentFilter = "all";

    const applyFilters = () => {
      const query = searchInput.value.toLowerCase().trim();

      document.querySelectorAll(".accordion").forEach((section) => {
          const categoryName = section.dataset.category.toLowerCase();
          const categoryMatches = query ? categoryName.includes(query) : false;

          const cards = Array.from(section.querySelectorAll(".feature"));
          const visibility = new Map();

          // Pass 1: Determine initial visibility for all features
          cards.forEach(card => {
              const checkbox = card.querySelector('input[type="checkbox"]');
              const featureKey = checkbox?.id;
              if (!featureKey) return;

              const featureData = features.find(f => f.key === featureKey);
              if (!featureData) return;

              const title = (featureData.name || "").toLowerCase();
              const desc = (featureData.description || "").toLowerCase();
              const isEnabled = checkbox.checked;

              let isVisible;
              if (categoryMatches) {
                  isVisible = true;
              } else {
                  isVisible = query ? (title.includes(query) || desc.includes(query)) : true;
              }
              if (isVisible && currentFilter === "enabled") isVisible = isEnabled;
              if (isVisible && currentFilter === "disabled") isVisible = !isEnabled;

              visibility.set(featureKey, isVisible);
          });

          // Pass 2: If a sub-feature is visible, ensure its parent is also visible
          cards.forEach(card => {
              const checkbox = card.querySelector('input[type="checkbox"]');
              const featureKey = checkbox?.id;
              if (!featureKey) return;

              const featureData = features.find(f => f.key === featureKey);
              if (!featureData || !isSubFeature(featureData)) return;

              if (visibility.get(featureKey)) { // if sub-feature is visible
                  const parentKey = featureData.requires;
                  if (parentKey) {
                      visibility.set(parentKey, true); // force parent to be visible
                  }
              }
          });

          let visibleCount = 0;
          // Pass 3: Apply visibility to DOM and update counts
          cards.forEach(card => {
              const checkbox = card.querySelector('input[type="checkbox"]');
              const featureKey = checkbox?.id;
              if (!featureKey) return;

              const isVisible = visibility.get(featureKey);
              card.style.display = isVisible ? '' : 'none';

              if (isVisible && !card.classList.contains('sub-feature')) {
                  visibleCount++;
              }
          });
          
          // Also need to hide/show the .sub-features containers
          section.querySelectorAll('.sub-features').forEach(container => {
              const hasVisibleChild = Array.from(container.querySelectorAll('.feature.sub-feature')).some(
                  child => child.style.display !== 'none'
              );
              container.style.display = hasVisibleChild ? '' : 'none';
          });

          section.style.display = visibleCount > 0 ? 'block' : 'none';
      });
    };

    applyFiltersRef = applyFilters;
    searchInput.addEventListener("input", applyFilters);

    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterBtns.forEach((b) => b.removeAttribute('data-state'));
            btn.dataset.state = "active";
            currentFilter = btn.dataset.filter;
            applyFilters();
        });
    });
  }

  setupFilters();
  // Notify background.js that the Extension UI world is ready to receive injected scripts
  console.log("❤️ Sending message to background.js that the popup is ready");
  chrome.runtime.sendMessage({ action: "popupReady" });

  // Listen for features to be loaded into the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "loadFeatureInPopup") {
      // Load CSS if provided
      if (message.cssFile) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL(message.cssFile);
        document.head.appendChild(link);
      }
      
      // Load JS if provided
      if (message.jsFile) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(message.jsFile);
        script.type = 'text/javascript';
        script.className = '❤️injected-script';
        document.head.appendChild(script);
      }
      
      sendResponse({ success: true });
    }
  });

});