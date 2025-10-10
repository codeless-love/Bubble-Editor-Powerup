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

        const toolbar = document.getElementById("editor-toolbar");
        if (toolbar) toolbar.hidden = domainState !== "Editor";

        const headerEl = document.querySelector("header");
        if (headerEl) headerEl.hidden = domainState !== "Editor";

        const footerEl = document.querySelector("footer");
        if (footerEl) footerEl.hidden = domainState !== "Editor";

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

    // Group features by categories
    const featuresByCategory = features.reduce((acc, feature) => {
        const category = feature.category || "Uncategorized"; // Default to "Uncategorized" if no category is specified
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(feature);
        return acc;
    }, {});

    const orderedCategories = [...categories, ...Object.keys(featuresByCategory).filter((category) => !categories.includes(category))];

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

    let applyFiltersRef = () => {};

    // Function to create input fields based on feature config
    const createFeatureInputs = (feature, container, isVisible = true) => {
        if (!feature.config || !feature.config.inputs || !feature.config.inputs.length) {
            return;
        }

        container.innerHTML = "";
        container.style.display = isVisible ? "flex" : "none";

        feature.config.inputs.forEach((inputConfig) => {
            chrome.storage.sync.get([inputConfig.key], (result) => {
                const storedValue = result[inputConfig.key];
                const initialValue = storedValue !== undefined ? storedValue : inputConfig.default;

                const group = document.createElement("div");
                group.className = "input-group";

                const label = document.createElement("label");
                const inputId = `${feature.key}-${inputConfig.key}`;
                label.setAttribute("for", inputId);
                label.textContent = inputConfig.label;

                let input;
                if (inputConfig.type === "textarea") {
                    input = document.createElement("textarea");
                } else {
                    input = document.createElement("input");
                    input.type = inputConfig.type === "checkbox" ? "checkbox" : inputConfig.type || "text";
                }

                input.id = inputId;

                if (inputConfig.placeholder) {
                    input.placeholder = inputConfig.placeholder;
                }

                if (inputConfig.type === "checkbox") {
                    input.checked = Boolean(initialValue);
                } else if (inputConfig.type === "number") {
                    input.value = initialValue ?? "";
                    if (inputConfig.min !== undefined) input.min = inputConfig.min;
                    if (inputConfig.max !== undefined) input.max = inputConfig.max;
                    if (inputConfig.step !== undefined) input.step = inputConfig.step;
                } else {
                    input.value = initialValue ?? "";
                }

                group.appendChild(label);
                group.appendChild(input);
                container.appendChild(group);

                input.addEventListener("change", () => {
                    let newValue;
                    if (inputConfig.type === "checkbox") {
                        newValue = input.checked;
                    } else if (inputConfig.type === "number") {
                        newValue = input.value === "" ? null : Number(input.value);
                    } else {
                        newValue = input.value;
                    }

                    const storageUpdate = {};
                    storageUpdate[inputConfig.key] = newValue;
                    chrome.storage.sync.set(storageUpdate);

                    changesMade = true;
                    saveButton.style.display = "block";
                });
            });
        });
    };

    function initNewUI() {
        const categoriesContainer = document.getElementById("categories-container");
        if (!categoriesContainer) {
            console.log("[Options.js] categories container not found");
            return;
        }

        categoriesContainer.innerHTML = "";

        orderedCategories.forEach((categoryName) => {
            const featureList = featuresByCategory[categoryName];
            if (!featureList || featureList.length === 0) return;

        const accordion = document.createElement("section");
        accordion.className = "accordion";
        accordion.dataset.state = "open";
        accordion.dataset.category = categoryName;

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "accordion-trigger";
        trigger.setAttribute("aria-expanded", "true");

        const titleSpan = document.createElement("span");
        titleSpan.textContent = categoryName;

        const countSpan = document.createElement("span");
            countSpan.className = "category-count";
            countSpan.dataset.count = "";

            trigger.appendChild(titleSpan);
            trigger.appendChild(countSpan);
            trigger.insertAdjacentHTML(
                "beforeend",
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
            );

            trigger.addEventListener("click", () => {
                const isOpen = accordion.dataset.state === "open";
                accordion.dataset.state = isOpen ? "closed" : "open";
                trigger.setAttribute("aria-expanded", (!isOpen).toString());
            });

            const content = document.createElement("div");
            content.className = "accordion-content";

            featureList.forEach((feature) => {
                if (isSubFeature(feature)) return;

                const card = createFeatureCard(feature);
                content.appendChild(card);

                const subFeatures = getSubFeatures(feature.key);
                if (subFeatures.length > 0) {
                    subFeatures.forEach((subFeature) => {
                        const subCard = createFeatureCard(subFeature, true);
                        content.appendChild(subCard);
                    });
                }
            });

            if (content.children.length > 0) {
                accordion.appendChild(trigger);
                accordion.appendChild(content);
                categoriesContainer.appendChild(accordion);
                updateCategoryCount(accordion);
            }
        });

        const loadingMsg = document.getElementById("loading-message");
        if (loadingMsg) {
            loadingMsg.style.display = "none";
        }

        setupFilters();

        console.log("[Options.js] ✅ UI refreshed with minimal layout");
    }

    function createFeatureCard(feature, isSubFeature = false) {
        const card = document.createElement("div");
        card.className = "feature";
        card.dataset.featureKey = feature.key;
        if (isSubFeature) {
            card.dataset.variant = "child";
        }

        const title = feature.name || feature.key;
        const desc = feature.description || "";
        const isEnabled = Boolean(prefs[feature.key]);

        card.dataset.title = title.toLowerCase();
        card.dataset.desc = desc.toLowerCase();
        card.dataset.enabled = isEnabled ? "true" : "false";

        const header = document.createElement("div");
        header.className = "feature-header";

        const label = document.createElement("div");
        label.className = "feature-label";
        label.textContent = title;

        const controls = document.createElement("div");
        controls.className = "feature-controls";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "switch";
        toggle.dataset.role = "feature-switch";
        toggle.dataset.state = isEnabled ? "on" : "off";
        toggle.setAttribute("role", "switch");
        toggle.setAttribute("aria-checked", isEnabled ? "true" : "false");
        toggle.setAttribute("aria-label", `Toggle ${title}`);
        controls.appendChild(toggle);

        header.appendChild(label);
        header.appendChild(controls);
        card.appendChild(header);

        if (desc) {
            const description = document.createElement("p");
            description.className = "feature-description";
            description.textContent = desc;
            card.appendChild(description);
        }

        let configContainer = null;
        if (feature.config && feature.config.inputs && feature.config.inputs.length) {
            configContainer = document.createElement("div");
            configContainer.className = "feature-config";
            configContainer.style.display = isEnabled ? "flex" : "none";
            card.appendChild(configContainer);
            createFeatureInputs(feature, configContainer, isEnabled);
        }

        if (feature.key === "enable_runtime_features") {
            const domainsSection = document.createElement("div");
            domainsSection.className = "feature-config feature-config-domains";

            const domainsContent = document.createElement("div");
            domainsContent.className = "domain-summary";

            const pending = candidateDomains.filter((domain) => !approvedDomains.includes(domain));
            if (pending.length > 0) {
                const pendingLabel = document.createElement("div");
                pendingLabel.className = "helper-text";
                pendingLabel.textContent = "Domains pending approval:";
                domainsContent.appendChild(pendingLabel);

                const pendingList = document.createElement("div");
                pendingList.className = "domain-list";
                pending.forEach((domain) => {
                    const chip = document.createElement("span");
                    chip.className = "domain-pill";
                    chip.textContent = domain;
                    pendingList.appendChild(chip);
                });
                domainsContent.appendChild(pendingList);
            }

            if (approvedDomains.length > 0) {
                const approvedLabel = document.createElement("div");
                approvedLabel.className = "helper-text";
                approvedLabel.textContent = "Approved domains:";
                domainsContent.appendChild(approvedLabel);

                const approvedList = document.createElement("div");
                approvedList.className = "domain-list";
                approvedDomains.forEach((domain) => {
                    const chip = document.createElement("span");
                    chip.className = "domain-pill";
                    chip.textContent = domain;
                    approvedList.appendChild(chip);
                });
                domainsContent.appendChild(approvedList);
            }

            if (!domainsContent.hasChildNodes()) {
                const emptyLabel = document.createElement("div");
                emptyLabel.className = "helper-text";
                emptyLabel.textContent = "No domains configured yet.";
                domainsContent.appendChild(emptyLabel);
            }

            domainsSection.appendChild(domainsContent);
            card.appendChild(domainsSection);
        }

        let isDisabled = false;
        if (isSubFeature) {
            const parentFeatureKey = feature.requires;
            isDisabled = !prefs[parentFeatureKey];
            if (isDisabled) {
                toggle.title = `Requires "${features.find((f) => f.key === parentFeatureKey)?.name || parentFeatureKey}" to be enabled.`;
            }
        } else if (!isDependencySatisfied(feature, prefs)) {
            isDisabled = true;
            toggle.title = `Requires "${features.find((f) => f.key === feature.requires)?.name || feature.requires}" to be enabled.`;
        }

        if (isDisabled) {
            card.dataset.disabled = "true";
            toggle.disabled = true;
            toggle.setAttribute("aria-disabled", "true");
        } else {
            toggle.addEventListener("click", () => {
                const shouldEnable = toggle.dataset.state !== "on";
                toggle.dataset.state = shouldEnable ? "on" : "off";
                toggle.setAttribute("aria-checked", shouldEnable ? "true" : "false");
                prefs[feature.key] = shouldEnable;
                card.dataset.enabled = shouldEnable ? "true" : "false";

                if (configContainer) {
                    configContainer.style.display = shouldEnable ? "flex" : "none";
                }

                updateDependentFeatures(feature, shouldEnable);
                checkForChanges();

                const parentAccordion = card.closest(".accordion");
                if (parentAccordion) {
                    updateCategoryCount(parentAccordion);
                }

                applyFiltersRef();
            });
        }

        return card;
    }

    function updateDependentFeatures(parentFeature, isParentChecked) {
        const dependentFeatures = getSubFeatures(parentFeature.key);

        dependentFeatures.forEach((dependentFeature) => {
            const dependentCard = document.querySelector(`[data-feature-key="${dependentFeature.key}"]`);
            if (!dependentCard) return;

            const dependentToggle = dependentCard.querySelector('[data-role="feature-switch"]');
            const dependentConfig = dependentCard.querySelector(".feature-config");
            const requirementTitle = `Requires "${parentFeature.name || parentFeature.key}" to be enabled.`;

            if (!isParentChecked) {
                dependentCard.dataset.disabled = "true";
                dependentCard.dataset.enabled = "false";
                prefs[dependentFeature.key] = false;

                if (dependentToggle) {
                    dependentToggle.disabled = true;
                    dependentToggle.dataset.state = "off";
                    dependentToggle.setAttribute("aria-disabled", "true");
                    dependentToggle.setAttribute("aria-checked", "false");
                    dependentToggle.title = requirementTitle;
                }

                if (dependentConfig) {
                    dependentConfig.style.display = "none";
                }

                updateDependentFeatures(dependentFeature, false);
            } else {
                delete dependentCard.dataset.disabled;
                if (dependentToggle) {
                    dependentToggle.disabled = false;
                    dependentToggle.removeAttribute("aria-disabled");
                    dependentToggle.title = "";
                }
            }
        });
    }

    function updateCategoryCount(accordion) {
        const cards = Array.from(accordion.querySelectorAll(".feature"));
        const topLevel = cards.filter((card) => !card.dataset.variant);
        const enabled = topLevel.filter((card) => card.dataset.enabled === "true");
        const countEl = accordion.querySelector(".category-count");
        if (countEl) {
            countEl.textContent = enabled.length > 0 ? `(${enabled.length})` : "";
        }
    }

    function setupFilters() {
        const searchInput = document.getElementById("feature-search");
        if (!searchInput) return;

        const filterBtns = document.querySelectorAll(".filter-button");
        let currentFilter = "all";

        const applyFilters = () => {
            const query = searchInput.value.toLowerCase().trim();

            document.querySelectorAll(".accordion").forEach((section) => {
                const cards = section.querySelectorAll(".feature");
                let visibleCount = 0;

                cards.forEach((card) => {
                    const title = card.dataset.title || "";
                    const desc = card.dataset.desc || "";
                    const enabled = card.dataset.enabled === "true";
                    const isSub = Boolean(card.dataset.variant);

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
                    if (visible && !isSub) {
                        visibleCount++;
                    }
                });

                section.style.display = visibleCount > 0 ? "" : "none";
            });
        };

        applyFiltersRef = applyFilters;

        searchInput.addEventListener("input", applyFilters);

        filterBtns.forEach((btn) => {
            if (btn.dataset.state !== "active") {
                btn.dataset.state = "inactive";
            }
            btn.addEventListener("click", () => {
                filterBtns.forEach((b) => b.dataset.state = "inactive");
                btn.dataset.state = "active";
                currentFilter = btn.dataset.filter;
                applyFilters();
            });
        });

        applyFilters();
    }

    initNewUI();

    const notificationStatus = document.getElementById("status");
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
});
