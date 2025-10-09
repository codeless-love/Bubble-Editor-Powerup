window.loadedCodelessLoveScripts ||= {};
(function () {
    console.log("❤️" + "Styles Drag Rearrange - ISOLATED WORLD script");
    const thisScriptKey = "styles_drag_rearrange";
    const ISOLATED_WORLD_SOURCE = "isolated-world-script";
    const MAIN_WORLD_SOURCE = "main-world-script";
    const SAVE_TOKEN_ACTION = "saveColorTokenOrder";
    const SAVE_RESULT_ACTION = "saveColorTokenOrderResult";
    const INITIAL_TOKEN_ACTION = "initialColorTokens";
    const REQUEST_TOKEN_ACTION = "requestInitialColorTokens";

    /* You can ignore all the stuff on this line, but don't delete! */ console.log("❤️" + window.loadedCodelessLoveScripts[thisScriptKey]);
    if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
        console.warn("❤️" + thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
        return;
    }
    /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
    console.log("❤️" + window.loadedCodelessLoveScripts[thisScriptKey]);
    let draggedElement = null;
    let saveButton = null;
    let tokenMetadataById = {};
    let mainWorldScriptInjected = false;
    let observerStarted = false;
    let initialized = false;

    const INVALID_DOM_TOKEN_IDS = new Set(["wrapper", "token-wrapper", ""]);
    let lastMetadataRequestAt = 0;
    const METADATA_REQUEST_COOLDOWN_MS = 1000;
    let latestColorTokens = {};

    function waitForElement(selector, callback) {
        console.log("running waitForElement");
        const existing = document.querySelector(selector);
        console.log("element", existing);
        if (existing) {
            callback(existing);
            return;
        }

        const elementObserver = new MutationObserver(() => {
            const target = document.querySelector(selector);
            if (target) {
                elementObserver.disconnect();
                callback(target);
            }
        });

        elementObserver.observe(document.body, { childList: true, subtree: true });
    }

    function injectMainWorldScript() {
        if (mainWorldScriptInjected) {
            return;
        }

        chrome.runtime.sendMessage({
            action: "injectScriptIntoMainWorld",
            jsFile: "features/styles-drag-rearrange/styles-drag-rearrange-main.js",
        });

        mainWorldScriptInjected = true;
    }

    function postToMainWorld(action, payload) {
        window.postMessage(
            {
                source: ISOLATED_WORLD_SOURCE,
                action,
                payload,
            },
            "*",
        );
    }

    // Extract token ID from a token wrapper element
    function getTokenId(wrapper) {
        if (wrapper.dataset.tokenId && !INVALID_DOM_TOKEN_IDS.has(wrapper.dataset.tokenId)) {
            return wrapper.dataset.tokenId;
        }

        // Token IDs are stored in class names like "token-cm123"
        // or in data attributes
        const classes = Array.from(wrapper.classList);
        for (const className of classes) {
            // Look for classes that match the token ID pattern (e.g., "token-cmMXY")
            if (className.startsWith("token-") && className.length > 6 && className !== "token-wrapper") {
                const potentialId = className.substring(6);
                if (!INVALID_DOM_TOKEN_IDS.has(potentialId)) {
                    return potentialId; // Remove "token-" prefix
                }
            }
        }

        // Fallback: check for data-token-id attribute
        if (wrapper.dataset.tokenId) {
            return wrapper.dataset.tokenId;
        }

        // Fallback: try to extract from child elements
        const tokenIdElement = wrapper.querySelector("[data-token-id]");
        if (tokenIdElement) {
            return tokenIdElement.dataset.tokenId;
        }

        console.warn("❤️ Could not find token ID for wrapper:", wrapper);
        return null;
    }

    function updateCurrentOrderAttributes() {
        const wrappers = document.querySelectorAll(".token-wrapper.draggable");
        wrappers.forEach((wrapper, index) => {
            wrapper.dataset.tokenCurrentOrder = String(index);
        });
    }

    function hasTokenContent(wrapper) {
        return Array.from(wrapper.children).some((child) => child.classList.contains("token-name-and-edit"));
    }

    function updateTokenMetadata(colorTokens) {
        if (!colorTokens || typeof colorTokens !== "object") {
            tokenMetadataById = {};
            latestColorTokens = {};
            syncDomWithMetadata();
            return;
        }

        latestColorTokens = colorTokens;
        tokenMetadataById = {};

        Object.entries(colorTokens).forEach(([tokenId, tokenInfo = {}]) => {
            if (!tokenId || INVALID_DOM_TOKEN_IDS.has(tokenId)) {
                return;
            }

            tokenMetadataById[tokenId] = {
                initialOrder: tokenInfo.order ?? null,
                name: tokenInfo.name || tokenInfo.display_name || tokenInfo.label || tokenInfo.text || null,
                value: tokenInfo.value || tokenInfo.color || tokenInfo.hex || tokenInfo.rgb || tokenInfo.rgba || null,
                rgba: tokenInfo.rgba || tokenInfo.color || tokenInfo.value || null,
            };
        });

        syncDomWithMetadata();
    }

    function syncDomWithMetadata() {
        const wrappers = Array.from(document.querySelectorAll(".token-wrapper")).filter(hasTokenContent);

        if (wrappers.length === 0) {
            maybeRequestMetadata();
            return;
        }

        const validIds = new Set();

        wrappers.forEach((wrapper) => {
            const existingId = wrapper.dataset.tokenId;
            if (existingId && tokenMetadataById[existingId]) {
                validIds.add(existingId);
                annotateWrapper(wrapper, existingId);
            }
        });

        const tokensToAssign = Object.entries(tokenMetadataById)
            .filter(([tokenId]) => !validIds.has(tokenId))
            .sort(([, a], [, b]) => {
                const orderA = a.initialOrder ?? Number.MAX_SAFE_INTEGER;
                const orderB = b.initialOrder ?? Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
            });

        wrappers.forEach((wrapper) => {
            const currentId = wrapper.dataset.tokenId;
            if (currentId && tokenMetadataById[currentId]) {
                return;
            }

            const nextEntry = tokensToAssign.shift();
            if (!nextEntry) {
                if (!latestColorTokens || Object.keys(latestColorTokens).length === 0) {
                    annotateWrapper(wrapper, undefined);
                }
                return;
            }

            const [tokenId] = nextEntry;
            annotateWrapper(wrapper, tokenId);
        });

        updateCurrentOrderAttributes();
    }

    function annotateWrapper(wrapper, tokenId) {
        const metadata = tokenMetadataById[tokenId];

        if (!metadata) {
            delete wrapper.dataset.tokenId;
            delete wrapper.dataset.tokenInitialOrder;
            delete wrapper.dataset.tokenName;
            delete wrapper.dataset.tokenValue;
            delete wrapper.dataset.tokenRgba;
            return;
        }

        wrapper.dataset.tokenId = tokenId;

        if (metadata.initialOrder !== undefined && metadata.initialOrder !== null) {
            wrapper.dataset.tokenInitialOrder = String(metadata.initialOrder);
        } else {
            delete wrapper.dataset.tokenInitialOrder;
        }

        if (metadata.name) {
            wrapper.dataset.tokenName = metadata.name;
        } else {
            delete wrapper.dataset.tokenName;
        }

        if (metadata.value) {
            wrapper.dataset.tokenValue = metadata.value;
        } else {
            delete wrapper.dataset.tokenValue;
        }

        if (metadata.rgba) {
            wrapper.dataset.tokenRgba = metadata.rgba;
        } else {
            delete wrapper.dataset.tokenRgba;
        }
    }

    function handleInitialColorTokensMessage(payload) {
        if (!payload) {
            return;
        }

        if (payload.status === "error") {
            console.error("❤️ Failed to receive initial color tokens:", payload.error);
            return;
        }

        console.log("❤️ Received initial color tokens", payload.colorTokens || payload);

        updateTokenMetadata(payload.colorTokens || payload);
    }

    function requestInitialColorTokens() {
        lastMetadataRequestAt = Date.now();
        postToMainWorld(REQUEST_TOKEN_ACTION, {});
    }

    function maybeRequestMetadata() {
        if (Object.keys(tokenMetadataById).length > 0) {
            return;
        }

        const now = Date.now();
        if (now - lastMetadataRequestAt < METADATA_REQUEST_COOLDOWN_MS) {
            return;
        }

        requestInitialColorTokens();
    }

    // Get current order of all token IDs from DOM
    function getCurrentTokenOrder() {
        const wrappers = document.querySelectorAll(".token-wrapper.draggable");
        const tokenOrder = [];

        wrappers.forEach((wrapper) => {
            const tokenId = getTokenId(wrapper);
            if (tokenId && tokenMetadataById[tokenId]) {
                tokenOrder.push(tokenId);
            } else if (tokenId) {
                console.warn("❤️ Skipping wrapper with unknown token id:", tokenId, wrapper);
            }
        });

        console.log("❤️ Current token order:", tokenOrder);
        return tokenOrder;
    }

    function updateMetadataOrder(tokenOrder) {
        if (!Array.isArray(tokenOrder) || tokenOrder.length === 0) {
            return;
        }

        const seen = new Set();

        tokenOrder.forEach((tokenId, index) => {
            if (!tokenId) {
                return;
            }

            seen.add(tokenId);

            if (tokenMetadataById[tokenId]) {
                tokenMetadataById[tokenId].initialOrder = index;
            }

            if (latestColorTokens[tokenId]) {
                latestColorTokens[tokenId].order = index;
            }
        });

        // Push any tokens not present to the end to preserve lookup data
        Object.keys(tokenMetadataById).forEach((tokenId) => {
            if (!seen.has(tokenId) && tokenMetadataById[tokenId]) {
                tokenMetadataById[tokenId].initialOrder = tokenOrder.length;
            }
        });

        Object.keys(latestColorTokens).forEach((tokenId) => {
            if (!seen.has(tokenId) && latestColorTokens[tokenId]) {
                latestColorTokens[tokenId].order = tokenOrder.length;
            }
        });
    }

    // Save the current order
    function saveOrder() {
        showSaveButton();

        const tokenOrder = getCurrentTokenOrder();

        if (tokenOrder.length === 0) {
            console.error("❤️ No tokens found to save");
            updateSaveButton("error", "No tokens found");
            return;
        }

        updateMetadataOrder(tokenOrder);

        // Update button state
        updateSaveButton("saving");

        // Send message to main world to save
        postToMainWorld(SAVE_TOKEN_ACTION, {
            tokenOrder,
        });
    }

    // Update save button state
    function updateSaveButton(state, message) {
        if (!saveButton) return;

        switch (state) {
            case "saving":
                saveButton.textContent = "Saving...";
                saveButton.disabled = true;
                saveButton.classList.add("saving");
                break;
            case "success":
                saveButton.textContent = message || "Saved!";
                saveButton.classList.remove("saving");
                saveButton.classList.add("success");
                // Hide after 2 seconds
                setTimeout(() => {
                    saveButton.classList.remove("show", "success");
                    saveButton.textContent = "Save Order";
                    saveButton.disabled = false;
                }, 2000);
                break;
            case "error":
                saveButton.textContent = message || "Error - Try Again";
                saveButton.disabled = false;
                saveButton.classList.remove("saving");
                saveButton.classList.add("error");
                // Reset after 3 seconds
                setTimeout(() => {
                    saveButton.textContent = "Save Order";
                    saveButton.classList.remove("error");
                }, 3000);
                break;
            default:
                saveButton.textContent = "Save Order";
                saveButton.disabled = false;
                saveButton.classList.remove("saving", "success", "error");
        }
    }

    // Listen for messages from main world
    window.addEventListener("message", (event) => {
        if (!event || event.source !== window || !event.data || event.data.source !== MAIN_WORLD_SOURCE) {
            return;
        }

        if (event.data.action === SAVE_RESULT_ACTION) {
            console.log("❤️ Received save result:", event.data);

            if (event.data.payload.status === "success") {
                updateSaveButton("success");
            } else {
                const errorMsg = event.data.payload.error || "Unknown error";
                console.error("❤️ Save failed:", errorMsg);
                updateSaveButton("error", "Error - Try Again");
            }
        }

        if (event.data.action === INITIAL_TOKEN_ACTION) {
            handleInitialColorTokensMessage(event.data.payload);
        }
    });

    // Create and add save order button
    function createSaveButton() {
        if (saveButton) return saveButton;

        saveButton = document.createElement("button");
        saveButton.id = "styles-save-order-btn";
        saveButton.textContent = "Save Order";

        saveButton.addEventListener("click", saveOrder);

        document.body.appendChild(saveButton);
        return saveButton;
    }

    // Show save button
    function showSaveButton() {
        const btn = createSaveButton();
        btn.classList.add("show");
    }

    // Function to make token wrappers draggable
    function createDragHandle(wrapper) {
        let handle = wrapper.querySelector(".token-drag-handle");

        if (!handle) {
            handle = document.createElement("div");
            handle.className = "token-drag-handle";

            for (let i = 0; i < 3; i += 1) {
                const bar = document.createElement("span");
                handle.appendChild(bar);
            }

            wrapper.insertBefore(handle, wrapper.firstChild);
        }

        if (!handle.dataset.dragHandleInitialized) {
            handle.setAttribute("draggable", "true");
            handle.dataset.dragHandleInitialized = "true";

            handle.addEventListener("dragstart", (event) => {
                draggedElement = wrapper;
                wrapper.classList.add("dragging");
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", wrapper.dataset.tokenId || "");

                if (event.dataTransfer.setDragImage) {
                    event.dataTransfer.setDragImage(wrapper, 10, 10);
                }
            });

            handle.addEventListener("dragend", () => {
                wrapper.classList.remove("dragging");
                draggedElement = null;

                document
                    .querySelectorAll(".drag-over, .drag-over-bottom")
                    .forEach((el) => el.classList.remove("drag-over", "drag-over-bottom"));
            });
        }

        return handle;
    }

    function makeDraggable() {
        // Find all token-wrapper elements that have a direct child with class token-name-and-edit
        syncDomWithMetadata();

        const tokenWrappers = Array.from(document.querySelectorAll(".token-wrapper")).filter(hasTokenContent);

        tokenWrappers.forEach((wrapper) => {
            // Skip if already processed
            if (wrapper.dataset.draggableEnabled) return;

            // Mark as processed
            wrapper.dataset.draggableEnabled = "true";
            wrapper.classList.add("draggable");

            const handle = createDragHandle(wrapper);

            // Ensure handle keeps draggable attribute if wrapper gets re-rendered
            if (!handle.hasAttribute("draggable")) {
                handle.setAttribute("draggable", "true");
            }

            // Drag over event
            wrapper.addEventListener("dragover", function (e) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = "move";

                if (!draggedElement || draggedElement === this) return;

                // Remove previous drag-over classes
                document.querySelectorAll(".drag-over, .drag-over-bottom").forEach((el) => {
                    el.classList.remove("drag-over", "drag-over-bottom");
                });

                // Determine if we should insert before or after based on mouse position
                const rect = this.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                if (e.clientY < midpoint) {
                    this.classList.add("drag-over");
                } else {
                    this.classList.add("drag-over-bottom");
                }

                return false;
            });

            // Drag enter event
            wrapper.addEventListener("dragenter", function (e) {
                if (draggedElement === this) return;
            });

            // Drag leave event
            wrapper.addEventListener("dragleave", function (e) {
                this.classList.remove("drag-over", "drag-over-bottom");
            });

            // Drop event
            wrapper.addEventListener("drop", function (e) {
                if (e.stopPropagation) {
                    e.stopPropagation();
                }

                if (!draggedElement || draggedElement === this) return false;

                // Determine if we should insert before or after
                const rect = this.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                if (e.clientY < midpoint) {
                    // Insert before
                    this.parentNode.insertBefore(draggedElement, this);
                } else {
                    // Insert after
                    this.parentNode.insertBefore(draggedElement, this.nextSibling);
                }

                document
                    .querySelectorAll(".drag-over, .drag-over-bottom")
                    .forEach((el) => el.classList.remove("drag-over", "drag-over-bottom"));

                updateCurrentOrderAttributes();

                saveOrder();

                return false;
            });
        });

        updateCurrentOrderAttributes();

        maybeRequestMetadata();
    }

    function startObserving() {
        if (observerStarted) {
            return;
        }

        const observer = new MutationObserver(function () {
            makeDraggable();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        observerStarted = true;
    }

    function initializeFeature() {
        if (initialized) {
            return;
        }

        initialized = true;

        injectMainWorldScript();
        makeDraggable();
        startObserving();

        setTimeout(() => {
            requestInitialColorTokens();
        }, 100);
    }

    waitForElement(".tokens-editor-wrapper.colors", initializeFeature);
})();

console.log("wait for element ran");
