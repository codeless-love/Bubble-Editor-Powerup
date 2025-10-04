document.addEventListener("DOMContentLoaded", async () => {
    console.log("[Options.js] Starting initialization");
    let candidateDomains = [];
    let approvedDomains = [];

    // Helper: Promisified chrome.storage.sync.get
    function getCandidateDomains() {
        return new Promise((resolve) => {
            chrome.storage.sync.get({ candidateDomains: [] }, (result) => {
                resolve(result.candidateDomains || []);
            });
        });
    }

    // Helper: Promisified chrome.permissions.getAll
    function getApprovedDomains() {
        return new Promise((resolve) => {
            chrome.permissions.getAll((perms) => {
                const domains = (perms.origins || [])
                    .map((origin) => {
                        try {
                            return origin
                                .replace(/^https?:\/\//, "")
                                .replace(/\/$|\*$/, "")
                                .replace(/\/$/, "");
                        } catch (e) {
                            return origin;
                        }
                    })
                    .filter(Boolean);
                resolve(domains);
            });
        });
    }

    // Wait for both candidateDomains and approvedDomains
    [candidateDomains, approvedDomains] = await Promise.all([getCandidateDomains(), getApprovedDomains()]);

    // --- DOMAIN STATE LOGIC ---
    let domainState = "Unrelated";
    let currentDomain = "";
    let currentPath = "";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log("[Options.js] Tabs query result:", tabs);
        if (!tabs || !tabs[0] || !tabs[0].url) {
            console.log("[Options.js] No valid tab found");
            return;
        }
        try {
            const url = new URL(tabs[0].url);
            currentDomain = url.hostname;
            currentPath = url.pathname;
            console.log("[Options.js] Current domain:", currentDomain, "path:", currentPath);
            const isBubbleEditor = (currentDomain.endsWith("bubble.io") || currentDomain.endsWith("bubble.is")) && currentPath.startsWith("/page");
            const isBubbleMain = currentDomain.endsWith("bubble.io") || currentDomain.endsWith("bubble.is");
            const isBubbleApps = currentDomain.endsWith("bubbleapps.io");
            const isCandidate = candidateDomains.includes(currentDomain) && !approvedDomains.includes(currentDomain);
            const isApproved = approvedDomains.includes(currentDomain) || isBubbleApps;
            console.log("[Options.js] isBubbleEditor:", isBubbleEditor, "isBubbleMain:", isBubbleMain, "isBubbleApps:", isBubbleApps);
            if (isBubbleEditor) {
                domainState = "Editor";
                console.log("[Options.js] Domain state: Editor");
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
        mainStates.forEach((state) => {
            const main = document.getElementById(state);
            if (main) main.hidden = state !== domainState;
        });

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
    console.log("[Options.js] Fetching features.json");
    const response = await fetch(chrome.runtime.getURL("features.json"));
    const features = await response.json();
    console.log("[Options.js] Loaded", features.length, "features");

    const defaults = features.reduce((acc, feature) => {
        acc[feature.key] = feature.default;
        return acc;
    }, {});
    // Retrieve existing preferences or use defaults
    const prefs = await new Promise((resolve) => {
        chrome.storage.sync.get(defaults, resolve);
    });
    console.log("[Options.js] Loaded preferences");

    // Track original preferences to detect changes
    const originalPrefs = JSON.parse(JSON.stringify(prefs));
    // Track whether changes have been made
    let changesMade = false;

    const container = document.getElementById("features-list");
    console.log("[Options.js] Container element:", container);

    const categories = [
        "Runtime",
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
        "Example Feature",
    ];

    const categoryIcons = {
        Runtime: "🎯",
        Expressions: "🧮",
        "Expression Composers": "🎼",
        "Property Editor": "🎨",
        Branches: "🌿",
        "Top Menubar": "📋",
        Sidebar: "📐",
        "Style Tab": "🎨",
        "Styler Tab": "🎨",
        "Design Canvas": "🎨",
        "Data View": "📊",
        "Workflow View": "⚙️",
        "Search Palette": "🔍",
        Merge: "🔀",
    };

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
        return !!prefs[feature.requires]; // Dependency is enabled
    };

    // Function to check if a feature is a sub-feature (has a parent)
    const isSubFeature = (feature) => {
        return !!feature.requires;
    };

    // Function to get all sub-features for a given parent feature
    const getSubFeatures = (parentFeatureKey) => {
        return features.filter((f) => f.requires === parentFeatureKey);
    };

    // Function to create input fields based on feature config
    const createFeatureInputs = (feature, containerDiv, isVisible = true) => {
        if (!feature.config || !feature.config.inputs || !feature.config.inputs.length) {
            return;
        }

        feature.config.inputs.forEach((inputConfig) => {
            // Get the stored value or use default
            chrome.storage.sync.get([inputConfig.key], function (result) {
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
                    const newValue = input.type === "checkbox" ? input.checked : input.type === "number" ? parseInt(input.value, 10) : input.value;

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

    function initNewUI() {
        const legacyContainer = document.getElementById("features-list");
        if (!legacyContainer) {
            console.log("[Options.js] features-list container not found");
            return;
        }

        // Create new UI structure
        const editor = document.getElementById("Editor");

        // Create toolbar
        const toolbar = document.createElement("div");
        toolbar.className = "toolbar";
        toolbar.innerHTML = `
    <div class="search-box">
      <span class="search-icon">🔎</span>
      <input id="feature-search" type="search" placeholder="Find features..." />
    </div>
    <div class="filters">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="enabled">Enabled</button>
      <button class="filter-btn" data-filter="disabled">Disabled</button>
    </div>
  `;

        const categoriesContainer = document.createElement("div");
        categoriesContainer.id = "categories-container";

        // Find the tool section to insert before it
        const toolSection = editor.querySelector(".tool-section");
        if (toolSection) {
            editor.insertBefore(toolbar, toolSection);
            editor.insertBefore(categoriesContainer, toolSection);
        } else {
            // Fallback: insert before legacy container
            editor.insertBefore(toolbar, legacyContainer);
            editor.insertBefore(categoriesContainer, legacyContainer);
        }

        // Process each category
        categories.forEach((categoryName) => {
            if (!featuresByCategory[categoryName]) return;

            const section = document.createElement("details");
            section.className = "category-section";
            section.open = true;
            section.dataset.category = categoryName;

            const header = document.createElement("summary");
            header.className = "category-header";
            const icon = categoryIcons[categoryName] || "📦";
            header.innerHTML = `
      <span class="category-icon">${icon}</span>
      <span>${categoryName}</span>
      <span class="category-count" data-count></span>
      <span class="chevron">▶</span>
    `;

            const grid = document.createElement("div");
            grid.className = "features-grid";

            section.appendChild(header);
            section.appendChild(grid);

            let featureCount = 0;
            featuresByCategory[categoryName].forEach((feature) => {
                if (isSubFeature(feature)) return;

                const card = createFeatureCard(feature);
                grid.appendChild(card);
                featureCount++;

                const subFeatures = getSubFeatures(feature.key);
                if (subFeatures.length > 0) {
                    subFeatures.forEach((subFeature) => {
                        const subCard = createFeatureCard(subFeature, true);
                        grid.appendChild(subCard);
                    });
                }
            });

            if (featureCount > 0) {
                categoriesContainer.appendChild(section);
                updateCategoryCount(section);
            }
        });

        // Hide loading message
        const loadingMsg = document.getElementById("loading-message");
        if (loadingMsg) {
            loadingMsg.style.display = "none";
        }

        // Setup search and filters
        setupFilters();

        console.log("[Options.js] ✅ UI Migration complete!");

        // Listen for checkbox changes to update counts
        document.addEventListener("change", (e) => {
            if (e.target.type === "checkbox") {
                setTimeout(() => {
                    document.querySelectorAll(".category-section").forEach(updateCategoryCount);
                }, 10);
            }
        });
    }

    function createFeatureCard(feature, isSubFeature = false) {
        const card = document.createElement("div");
        card.className = isSubFeature ? "feature-card sub-feature" : "feature-card";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = prefs[feature.key];
        checkbox.id = feature.key;
        checkbox.className = "feature-checkbox";

        const title = feature.name;
        const desc = feature.description;

        card.dataset.title = title.toLowerCase();
        card.dataset.desc = desc.toLowerCase();
        card.dataset.enabled = checkbox.checked ? "true" : "false";

        const mainDiv = document.createElement("div");
        mainDiv.className = "feature-main";

        mainDiv.appendChild(checkbox);

        const content = document.createElement("div");
        content.className = "feature-content";

        const titleDiv = document.createElement("div");
        titleDiv.className = "feature-title";
        titleDiv.textContent = title;

        const descDiv = document.createElement("div");
        descDiv.className = "feature-description";
        descDiv.textContent = desc;

        content.appendChild(titleDiv);
        content.appendChild(descDiv);

        mainDiv.appendChild(content);
        card.appendChild(mainDiv);

        // Add inputs if any
        if (feature.config && feature.config.inputs) {
            createFeatureInputs(feature, card, checkbox.checked);
        }

        // Add domains if any
        if (feature.key === "enable_runtime_features") {
            const domainsContainer = document.createElement("div");
            domainsContainer.className = "candidate-domains";
            domainsContainer.textContent = "Loading domains...";
            card.appendChild(domainsContainer);
            if (candidateDomains.length === 0) {
                domainsContainer.textContent = "No eligible domains.";
            } else {
                const unapprovedCandidateDomains = candidateDomains.filter((domain) => !approvedDomains.includes(domain));
                if (unapprovedCandidateDomains.length === 0) {
                    domainsContainer.style.display = "none";
                } else {
                    domainsContainer.textContent = "Domains waiting for approval:";
                    const container = document.createElement("div");
                    container.className = "candidate-domains-list";
                    unapprovedCandidateDomains.forEach((domain) => {
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
            card.appendChild(approvedContainer);

            if (approvedDomains.length === 0) {
                approvedContainer.style.display = "none";
            } else {
                approvedContainer.textContent = "Approved domains:";
                const container = document.createElement("div");
                container.className = "candidate-domains-list";
                approvedDomains.forEach((domain) => {
                    const span = document.createElement("span");
                    span.textContent = domain;
                    container.appendChild(span);
                });
                approvedContainer.appendChild(container);
            }
        }

        let isDisabled = false;
        if (isSubFeature) {
            const parentFeatureKey = feature.requires;
            const parentFeature = features.find((f) => f.key === parentFeatureKey);
            isDisabled = !prefs[parentFeatureKey];
            if (isDisabled) {
                checkbox.title = `Requires "${parentFeature.name}" to be enabled.`;
            }
        } else if (!isDependencySatisfied(feature, prefs)) {
            isDisabled = true;
            checkbox.title = `Requires "${features.find((f) => f.key === feature.requires)?.name || feature.requires}" to be enabled.`;
        }

        if (isDisabled) {
            card.classList.add("disabled");
            checkbox.disabled = true;
        } else {
            checkbox.addEventListener("change", () => {
                prefs[feature.key] = checkbox.checked;
                card.dataset.enabled = checkbox.checked ? "true" : "false";
                updateDependentFeatures(feature, checkbox.checked);
                checkForChanges();

                if (feature.config && feature.config.inputs) {
                    const inputContainers = card.querySelectorAll(".input-container");
                    inputContainers.forEach((container) => {
                        container.style.display = checkbox.checked ? "flex" : "none";
                    });
                }
            });

            card.addEventListener("click", (e) => {
                if (e.target === checkbox || e.target.closest(".input-container")) return;
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event("change"));
            });
        }

        return card;
    }

    function updateDependentFeatures(parentFeature, isParentChecked) {
        const dependentFeatures = getSubFeatures(parentFeature.key);

        dependentFeatures.forEach((dependentFeature) => {
            const dependentCard = document.getElementById(dependentFeature.key).closest(".feature-card");
            const dependentCheckbox = dependentCard.querySelector(".feature-checkbox");

            if (!isParentChecked) {
                dependentCard.classList.add("disabled");
                dependentCheckbox.disabled = true;
                dependentCheckbox.checked = false;
                prefs[dependentFeature.key] = false;
                dependentCard.dataset.enabled = "false";
                dependentCheckbox.title = `Requires "${parentFeature.name}" to be enabled.`;
                updateDependentFeatures(dependentFeature, false);
            } else {
                dependentCard.classList.remove("disabled");
                dependentCheckbox.disabled = false;
                dependentCheckbox.title = "";
            }
        });
    }

    function updateCategoryCount(section) {
        const grid = section.querySelector(".features-grid");
        const cards = Array.from(grid.querySelectorAll(".feature-card:not(.sub-feature)"));
        const enabled = cards.filter((c) => c.dataset.enabled === "true");
        const countEl = section.querySelector("[data-count]");
        countEl.textContent = enabled.length > 0 ? `(${enabled.length})` : "";
    }

    function setupFilters() {
        const searchInput = document.getElementById("feature-search");
        const filterBtns = document.querySelectorAll(".filter-btn");
        let currentFilter = "all";

        const applyFilters = () => {
            const query = searchInput.value.toLowerCase().trim();

            document.querySelectorAll(".category-section").forEach((section) => {
                const cards = section.querySelectorAll(".feature-card");
                let visibleCount = 0;

                cards.forEach((card) => {
                    const title = card.dataset.title || "";
                    const desc = card.dataset.desc || "";
                    const enabled = card.dataset.enabled === "true";

                    let visible = true;

                    if (query) {
                        visible = title.includes(query) || desc.includes(query);
                    }

                    if (visible && currentFilter !== "all") {
                        if (currentFilter === "enabled") {
                            visible = enabled;
                        } else if (currentFilter === "disabled") {
                            visible = !enabled;
                        }
                    }

                    card.style.display = visible ? "" : "none";
                    if (visible && !card.classList.contains("sub-feature")) {
                        visibleCount++;
                    }
                });

                section.style.display = visibleCount > 0 ? "" : "none";
            });
        };

        searchInput.addEventListener("input", applyFilters);

        filterBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                filterBtns.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                currentFilter = btn.dataset.filter;
                applyFilters();
            });
        });

        applyFilters();
    }

    initNewUI();

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
        for (const key in prefs) {
            if (prefs[key] !== originalPrefs[key]) {
                hasChanges = true;
                break;
            }
        }

        changesMade = hasChanges;
        saveButton.style.display = changesMade ? "block" : "none";
    };

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
        await new Promise((resolve) => {
            chrome.storage.sync.set(prefs, resolve);
        });

        Object.assign(originalPrefs, prefs);

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
    // Reload all Bubble and Bubble.is tabs
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
