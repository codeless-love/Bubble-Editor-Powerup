/**
 * Loads and initializes the drag & drop functionality for color tokens in the Bubble editor.
 * This script allows users to reorder color tokens by dragging and dropping them in the UI.
 *
 * @module style-drag-rearrange/loader
 *
 * @requires Sortable.min.js - For drag & drop functionality
 * @requires appqueryScripts.js - For interacting with Bubble's appquery API
 *
 * @global {Object} window.loadedCodelessLoveScripts - Tracks loaded script status
 * @global {Object} initialColorOrder - Stores the original color order from appquery
 * @global {Array} initialColorArray - Array of non-deleted colors with their metadata
 * @global {Array} initialOrder - Simple array of color IDs in original order
 * @global {MutationObserver} observer - Watches for DOM changes
 * @global {HTMLElement} sortableScript - Script element for loading appquery scripts
 * @global {Sortable} colorsSortable - Sortable instance for drag & drop
 * @global {HTMLElement} saveButton - Button element for saving new color order
 *
 * @fires Event#getInitialColors - Triggered to fetch initial color order
 * @fires CustomEvent#colorOrderChanged - Triggered when color order is saved
 * @fires CustomEvent#initialColorOrder - Received when initial colors are loaded
 *
 * @example
 * // Initialize the drag & drop functionality
 * load();
 */

// TODO: if the user changes a color, reset the initialColorOrder.
// TODO: after saving the order, reset the initialColorOrder.
// TODO: allow multi-drag and drop of colors;

window.loadedCodelessLoveScripts ||= {};

let initialColorOrder = {}; // object with colors from appquery.get_custom...
let initialColorArray = []; // an array of the original appquery object with the deleted items removed
let initialOrder = []; // simple array of ids. Used in Sortable to show/hide the save button

let observer;
let sortableScript;
let colorsSortable;
let sortableNodes = [];

let classRestoreObserver;

const saveButton = document.createElement("button");

function getInitialColors() {
  const event = new Event("getInitialColors");
  document.dispatchEvent(event);
}

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
    // Check if element is already there on load
    observer.disconnect();
    callback();
  }
}

document.addEventListener("initialColorOrder", (e) => {
  initialColorOrder = {};
  initialOrder = [];
  initialColorArray = [];

  initialColorOrder = e.detail.default;

  // remove deleted items and put this in an array for easier handling
  for (const [key, value] of Object.entries(initialColorOrder)) {
    if (value.deleted === false) {
      value.id = key;
      initialColorArray.splice(value.order, 0, value);
      initialOrder.splice(value.order, 0, key);
    }
  }

  const itemsOutOfOrder = initialColorArray.filter((item, index) => {
    item.id !== initialOrder[index];
  });
  console.log("items out of order:", itemsOutOfOrder);

  handleTokenColors();
});

function loadAppqueryScripts() {
  sortableScript = document.createElement("script");
  sortableScript.src = chrome.runtime.getURL(
    "features/style-drag-rearrange/appqueryScripts.js",
  );
  sortableScript.onload = () => {
    console.log("sortable script loaded");
    getInitialColors();
    // handleTokenColors();
  };
  document.head.appendChild(sortableScript);
}

function load() {
  console.log("❤️ " + "Drag & Drop Style");
  let thisScriptKey = "style_drag_rearrange";

  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    if (classRestoreObserver) {
      classRestoreObserver.disconnect();
    }
    console.warn(
      "❤️ " +
        thisScriptKey +
        " tried to load, but it's value is already " +
        window.loadedCodelessLoveScripts[thisScriptKey],
    );
    return;
  }

  window.loadedCodelessLoveScripts[thisScriptKey] = "loading"; // Change status to loading

  createSaveButton();
  waitForElement(".tokens-editor-wrapper.colors", loadAppqueryScripts);
}

function createSaveButton() {
  // Add save button to the page (hidden by default)
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
          console.log("order changed", item.order, " to: ", index);
          item.order = index;
          console.log("item", item);
        }
      } else {
        console.warn("item not found when saving");
      }
    });

    // After saving, update the initial order and hide the button
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

async function maybeSetupSortable(colorWrapper) {
  if (colorsSortable) {
    console.log("sortable already set up, returning");
    return;
  }
  console.log("sortable not yet created, creating it");
  // Get the Sortable constructor - try different ways of accessing it
  const sortableModule = await import(
    chrome.runtime.getURL("utils/Sortable.min.js")
  );
  const SortableConstructor =
    sortableModule.Sortable || // Try direct named export
    sortableModule.default || // Try default export
    window.Sortable; // Try global

  if (!SortableConstructor) {
    throw new Error("Failed to load Sortable constructor", sortableModule);
  }

  // Initialize Sortable directly on the tokens-editor-wrapper
  colorsSortable = new Sortable(colorWrapper, {
    animation: 150,
    ghostClass: "sortable-ghost",
    dragClass: "sortable-drag",
    draggable: ".draggable-custom-color", // Only make token-wrapper elements draggable
    handle: ".token-name-and-edit", // Make it draggable by the caption
    dataIdAttr: "data-id",
    onEnd: () => {
      let currentOrder = colorsSortable.toArray();

      // Compare current order with initial order
      if (JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
        saveButton.style.display = "block";
      } else {
        saveButton.style.display = "none";
      }
    },
  });
}

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

    // Add data-id attributes to token wrappers
    const tokenWrappers = colorWrapper.querySelectorAll(
      ".token-wrapper:has(.token-name-and-edit)",
    );

    // TODO: need better error handling here, this needs to not add the drag-handles if it errors
    if (tokenWrappers.length !== initialOrder.length) {
      throw new Error(
        "The numbers of colors on screen and on appquery don't match. onscreen: ",
        tokenWrappers.length,
        ", on appquery: ",
        initialOrder.length,
      );
    }

    let hasMismatch = false;
    // iterate through the tokens and add the item.id to each
    for (const [index, wrapper] of tokenWrappers.entries()) {
      // tokenWrappers.forEach((wrapper, index) => {
      item = initialColorArray[index];

      // check if the colors of the item and the wrapper match to ensure that
      // we don't continue if there is a mistmatch
      const colorSwatch = wrapper.querySelector(".color-swatch");
      const swatchBgColor = colorSwatch?.style.background;

      // Convert rgba(r,g,b,a) to rgb(r,g,b)
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
      // Clean up existing Sortable instance
      colorsSortable?.destroy();
      colorsSortable = null;

      // Reset initial colors and restart
      getInitialColors();
      return;
    }

    // checks if the sortable object needs to be created
    await maybeSetupSortable(colorWrapper);
    setupClassRestoreObserver();
  } catch (error) {
    console.error("there was an error", error);
  }
}

function setupClassRestoreObserver() {
  if (classRestoreObserver) {
    classRestoreObserver.disconnect();
  }

  classRestoreObserver = new MutationObserver((mutations) => {
    const colorWrapper = document.querySelector(
      ".tokens-editor-wrapper.colors",
    );
    if (!colorWrapper) return;

    // Delay the check slightly to ensure DOM is stable
    setTimeout(() => {
      const tokenWrappers = colorWrapper.querySelectorAll(
        ".token-wrapper:has(.token-name-and-edit)",
      );

      tokenWrappers.forEach((wrapper, index) => {
        const item = initialColorArray[index];
        if (!item) return;

        const colorSwatch = wrapper.querySelector(".color-swatch");
        if (!colorSwatch) return;

        const swatchBgColor = colorSwatch.style.background;
        const rgbaMatch = item.rgba.match(/rgba\((\d+),(\d+),(\d+),[\d.]+\)/);

        if (rgbaMatch) {
          const itemRgbStr = `rgb(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]})`;
          if (swatchBgColor === itemRgbStr) {
            if (!wrapper.classList.contains("draggable-custom-color")) {
              console.log("Restoring draggable class to:", wrapper);
              wrapper.classList.add("draggable-custom-color");
              wrapper.setAttribute("data-id", item.id);
            }
          }
        }
      });
    }, 100);
  });

  // Observe the specific wrapper instead of the entire body
  const colorWrapper = document.querySelector(".tokens-editor-wrapper.colors");
  if (colorWrapper) {
    classRestoreObserver.observe(colorWrapper, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
      characterData: false,
    });
  }
}

load();
