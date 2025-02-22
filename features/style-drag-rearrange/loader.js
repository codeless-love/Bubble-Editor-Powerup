/**
 * Loads and initializes the drag & drop functionality for color tokens in the Bubble editor.
 *
 * This script allows users to reorder color tokens by dragging and dropping them in the UI.
 * It also manages the synchronization between the UI order and the order provided by appquery.
 *
 * @module style-drag-rearrange/loader
 *
 * @requires Sortable.min.js - For drag & drop functionality.
 * @requires appqueryScripts.js - For interacting with Bubble's appquery API.
 *
 * @global {Object} window.loadedCodelessLoveScripts - Tracks the loading status of scripts.
 * @global {Object} initialColorOrder - Stores the original color order from appquery.
 * @global {Array} initialColorArray - Array of active (non-deleted) colors with metadata.
 * @global {Array} initialOrder - Simple array of color IDs representing the initial order.
 * @global {MutationObserver} observer - Observes DOM changes for element availability.
 * @global {HTMLElement} sortableScript - Script element for loading appquery scripts.
 * @global {Sortable} colorsSortable - Instance of the Sortable class for drag & drop.
 * @global {HTMLElement} saveButton - Button element for saving the new color order.
 *
 * @fires Event#getInitialColors - Triggered to request the initial color order.
 * @fires CustomEvent#colorOrderChanged - Dispatched when the color order is saved.
 * @fires CustomEvent#initialColorOrder - Dispatched with the initial colors from appquery.
 *
 * @example
 * // Initialize the drag & drop functionality
 * load();
 *
 * @todo Reset initialColorOrder if a color is changed.
 * @todo Reset initialColorOrder after saving the new order.
 * @todo Allow multi-drag and drop of colors.
 */

window.loadedCodelessLoveScripts ||= {};

let initialColorOrder = {}; // Object holding colors from appquery.get_custom...
let initialColorArray = []; // Array of active colors without deleted items.
let initialOrder = []; // Simple array of ids used in Sortable to manage the save button.

let observer;
let sortableScript;
let colorsSortable;
let sortableNodes = [];
let isResetting = false;
let classRestoreObserver;

const saveButton = document.createElement("button");

/**
 * Dispatches a 'getInitialColors' event to request the initial order of color tokens from appquery.
 */
function getInitialColors() {
  const event = new Event("getInitialColors");
  document.dispatchEvent(event);
}

/**
 * Waits for the presence of a specific element in the DOM and then executes a callback.
 *
 * @param {string} selector - CSS selector for the target element.
 * @param {Function} callback - Function to execute once the element is available.
 */
function waitForElement(selector, callback) {
  console.log("waitForElement", selector);
  observer = new MutationObserver((mutationsList, observer) => {
    if (document.querySelector(selector)) {
      console.log("found selectors", selector);
      observer.disconnect();
      console.log("disconnecting observer", selector, "performing callback");
      callback();
    }
  });
  console.log("created observer", selector);

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("observer observing", selector);
  if (document.querySelector(selector)) {
    console.log(
      "selector was already there, disconnecting, and running callback",
    );
    // If the element already exists, disconnect the observer and call the callback.
    observer.disconnect();
    callback();
  }
}

document.addEventListener("initialColorOrder", (e) => {
  // Reset order data on receiving new initial color order
  initialColorOrder = {};
  initialOrder = [];
  initialColorArray = [];

  initialColorOrder = e.detail.default;

  // Remove deleted items and reassemble the arrays for easier processing.
  for (const [key, value] of Object.entries(initialColorOrder)) {
    if (value.deleted === false) {
      value.id = key;
      initialColorArray.splice(value.order, 0, value);
      initialOrder.splice(value.order, 0, key);
    }
  }

  const itemsOutOfOrder = initialColorArray.filter((item, index) => {
    return item.id !== initialOrder[index];
  });
  console.log("items out of order:", itemsOutOfOrder);

  handleTokenColors();
});

/**
 * Dynamically loads the appquery scripts required for token operations.
 */
function loadAppqueryScripts() {
  sortableScript = document.createElement("script");
  sortableScript.src = chrome.runtime.getURL(
    "features/style-drag-rearrange/appqueryScripts.js",
  );
  sortableScript.onload = () => {
    console.log("sortable script loaded");
    getInitialColors();
  };
  document.head.appendChild(sortableScript);
}

/**
 * Initializes the drag & drop functionality.
 *
 * This function sets the loading status, creates the save button,
 * and waits for the target color editor element before loading appquery scripts.
 */
function load() {
  console.log("❤️ Drag & Drop Style");
  let thisScriptKey = "style_drag_rearrange";

  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    if (classRestoreObserver) {
      classRestoreObserver.disconnect();
    }
    console.warn(
      "❤️ " +
        thisScriptKey +
        " tried to load, but its value is already " +
        window.loadedCodelessLoveScripts[thisScriptKey],
    );
    return;
  }

  window.loadedCodelessLoveScripts[thisScriptKey] = "loading"; // Change status to loading

  createSaveButton();
  waitForElement(".tokens-editor-wrapper.colors", loadAppqueryScripts);
}

/**
 * Creates and inserts the save button into the DOM.
 *
 * The button is hidden by default and becomes visible when the color order changes.
 * On click, it compares the current order with the initial order, updates orders,
 * dispatches an event, and reinitializes token color state.
 */
function createSaveButton() {
  saveButton.id = "sortable-save-button";
  saveButton.innerHTML = "💾 Save New Order";
  saveButton.style.display = "none";
  document.body.appendChild(saveButton);

  saveButton.addEventListener("click", () => {
    console.log("save button clicked");
    const newOrder = colorsSortable.toArray();
    newOrder.forEach((id, index) => {
      const item = initialColorOrder[id];
      if (item) {
        if (item.order !== index) {
          console.log("order changed", item.order, "to:", index);
          item.order = index;
          console.log("item", item);
        }
      } else {
        console.warn("item not found when saving");
      }
    });

    // After saving, update the initial order and hide the save button.
    saveButton.style.display = "none";
    const event = new CustomEvent("colorOrderChanged", {
      detail: { default: initialColorOrder },
    });
    document.dispatchEvent(event);

    setTimeout(() => {
      handleTokenColors();
    }, 200);

    console.log("save flow, dispatched event", event);
  });
}

/**
 * Checks if a Sortable instance has already been initialized.
 * If not, it loads the Sortable constructor and initializes it on the color wrapper.
 *
 * @param {HTMLElement} colorWrapper - The DOM element containing color tokens.
 *
 * @throws {Error} If the Sortable constructor cannot be loaded.
 */
async function maybeSetupSortable(colorWrapper) {
  if (colorsSortable) {
    console.log("sortable already set up, returning");
    return;
  }
  console.log("sortable not yet created, creating it");
  // Dynamically import the Sortable library.
  const sortableModule = await import(
    chrome.runtime.getURL("utils/Sortable.min.js")
  );
  const SortableConstructor =
    sortableModule.Sortable || // Named export.
    sortableModule.default || // Default export.
    window.Sortable; // Global variable.

  if (!SortableConstructor) {
    throw new Error("Failed to load Sortable constructor", sortableModule);
  }

  // Initialize Sortable on the provided colorWrapper.
  colorsSortable = new SortableConstructor(colorWrapper, {
    animation: 150,
    ghostClass: "sortable-ghost",
    dragClass: "sortable-drag",
    draggable: ".draggable-custom-color",
    handle: ".token-name-and-edit",
    dataIdAttr: "data-id",
    onEnd: () => {
      let currentOrder = colorsSortable.toArray();
      // If the order has changed, show the save button.
      if (JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
        saveButton.style.display = "block";
      } else {
        saveButton.style.display = "none";
      }
    },
  });
}

/**
 * Handles the synchronization of token colors between the DOM and appquery data.
 *
 * It verifies that the number of tokens on screen matches the initial order.
 * It then adds proper data attributes and initializes Sortable if needed.
 * Any color mismatches trigger a reset of the color data.
 */
async function handleTokenColors() {
  try {
    if (initialOrder.length === 0) {
      console.log("Missing initialOrder, triggering event");
      getInitialColors();
      return;
    }

    const colorWrapper = document.querySelector(
      ".tokens-editor-wrapper.colors",
    );
    if (!colorWrapper) {
      console.warn("colorWrapper not found, returning");
      return;
    }

    // Select token wrappers that contain an element with the class "token-name-and-edit".
    const tokenWrappers = colorWrapper.querySelectorAll(
      ".token-wrapper:has(.token-name-and-edit)",
    );

    if (tokenWrappers.length !== initialOrder.length) {
      throw new Error(
        "The numbers of colors on screen and on appquery don't match. onscreen: " +
          tokenWrappers.length +
          ", on appquery: " +
          initialOrder.length,
      );
    }

    let hasMismatch = false;
    // Loop through tokens and add proper data attributes.
    for (const [index, wrapper] of tokenWrappers.entries()) {
      const item = initialColorArray[index];

      // Verify that the color displayed on the element matches the appquery data.
      const colorSwatch = wrapper.querySelector(".color-swatch");
      const swatchBgColor = colorSwatch?.style.background;

      // Convert rgba color format to rgb.
      const rgbaMatch = item.rgba.match(/rgba\((\d+),(\d+),(\d+),[\d.]+\)/);
      if (!rgbaMatch) {
        console.warn("Invalid rgba format:", item.rgba);
        return;
      }
      const itemRgbStr = `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;

      if (swatchBgColor !== itemRgbStr) {
        console.warn("Color mismatch:", {
          elementId: item.id,
          expectedColor: itemRgbStr,
          actualColor: swatchBgColor,
        });
        hasMismatch = true;
        break;
      }

      wrapper.classList.add("draggable-custom-color");
      wrapper.setAttribute("data-id", item.id);
    }
    if (hasMismatch) {
      console.log("Color mismatch detected, resetting");
      // Prevent additional resets until one is processed
      if (!isResetting) {
        isResetting = true;
        colorsSortable?.destroy();
        colorsSortable = null;
        getInitialColors();
        // Reset the flag after a short delay or when data is reloaded
        setTimeout(() => {
          isResetting = false;
        }, 500);
      }
      return;
    }

    await maybeSetupSortable(colorWrapper);
  } catch (error) {
    console.error("there was an error", error);
  }
}

load();
