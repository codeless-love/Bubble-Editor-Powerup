// TODO: if the user changes a color, reset the initialColorOrder.
// TODO: after saving the order, reset the initialColorOrder.
// TODO: allow multi-drag and drop of colors;

window.loadedCodelessLoveScripts ||= {};

// receive the initial color from the appquery element so we can match that with what's on the screen.
let initialColorOrder = {};
let initialOrder = [];
let initialColorArray = [];

let observer;
let sortableScript;

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
      "selector was already there, disconnecting, and running callback"
    );
    // Check if element is already there on load
    observer.disconnect();
    callback();
  }
}

document.addEventListener("initialColorOrder", (e) => {
  console.log("event triggered getInitialColors");
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

  handleTokenColors();
});

function loadSortableScript() {
  sortableScript = document.createElement("script");
  sortableScript.src = chrome.runtime.getURL(
    "features/style-drag-rearrange/drag.js"
  );
  sortableScript.onload = () => {
    console.log("sortable script loaded");
    handleTokenColors();
  };
  document.head.appendChild(sortableScript);
}

function load() {
  console.log("❤️ " + "Drag & Drop Style");
  let thisScriptKey = "style_drag_rearrange";

  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn(
      "❤️ " +
        thisScriptKey +
        " tried to load, but it's value is already " +
        window.loadedCodelessLoveScripts[thisScriptKey]
    );
    return;
  }

  window.loadedCodelessLoveScripts[thisScriptKey] = "loading"; // Change status to loading

  waitForElement(".tokens-editor-wrapper.colors", loadSortableScript);
}

async function handleTokenColors() {
  console.log("handleTokenColors running");
  try {
    if (!initialOrder) {
      console.log("Missing initialOrder, returning");
      return;
    }

    const colorWrapper = document.querySelector(
      ".tokens-editor-wrapper.colors"
    );
    if (!colorWrapper) return;

    // Add data-id attributes to token wrappers
    const tokenWrappers = colorWrapper.querySelectorAll(
      ".token-wrapper:has(.token-name-and-edit)"
    );

    // TODO: need better error handling here, this needs to not add the drag-handles if it errors
    if (tokenWrappers.length !== initialOrder.length) {
      throw new Error(
        "The numbers of colors on screen and on appquery don't match. onscreen: ",
        tokenWrappers.length,
        ", on appquery: ",
        initialOrder.length
      );
    }

    // iterate through the tokens and add the item.id to each
    tokenWrappers.forEach((wrapper, index) => {
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
        return; // Skip adding drag functionality if colors don't match
      }

      wrapper.classList.add("draggable-custom-color");
      wrapper.setAttribute("data-id", item.id);
    });

    // Add save button to the page (hidden by default)
    const saveButton = document.createElement("button");
    saveButton.id = "sortable-save-button";
    saveButton.innerHTML = "💾 Save New Order";
    saveButton.style.display = "none";
    document.body.appendChild(saveButton);

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
    let colorsSortable = new Sortable(colorWrapper, {
      animation: 150,
      ghostClass: "sortable-ghost",
      dragClass: "sortable-drag",
      draggable: ".draggable-custom-color", // Only make token-wrapper elements draggable
      handle: ".token-name-and-edit", // Make it draggable by the caption
      dataIdAttr: "data-id",
      onEnd: (evt) => {
        let currentOrder = colorsSortable.toArray();

        // Compare current order with initial order
        if (JSON.stringify(currentOrder) !== JSON.stringify(initialOrder)) {
          saveButton.style.display = "block";
        } else {
          saveButton.style.display = "none";
        }
      },
    });

    // Add save button click handler
    saveButton.addEventListener("click", () => {
      const newOrder = colorsSortable.toArray();
      const newOrderObj = {};
      newOrder.forEach((id, index) => {
        const item = initialColorOrder[id];
        if (item) {
          if (item.order !== index) {
            console.log("order changed", item.order, " to: ", index);
            item.order = index;
            console.log("item", item);
          }
        } else {
          console.log("item not found");
        }
      });

      // After dispatching the event, set up observer to watch for class removals
      // const tabPanel = document.querySelector(".tab-panel.style");
      // console.log("tabPanel", tabPanel);
      // if (!tabPanel) {
      //   console.warn("Could not find .tab-panel.style element");
      //   return;
      // }

      // observer = new MutationObserver((mutations) => {
      //   console.log("observer detected changes in tab panel");
      //   const colorWrapper = tabPanel.querySelector(
      //     ".tokens-editor-wrapper.colors"
      //   );
      //   if (!colorWrapper) {
      //     console.log(".tokens-editor-wrapper not present, returning");
      //     return;
      //   }

      //   const elements = colorWrapper.querySelectorAll(".token-wrapper");
      //   const needsReinitialization = Array.from(elements).some(
      //     (el) => !el.classList.contains("draggable-custom-color")
      //   );

      //   console.log("needsReinitialization status", needsReinitialization);
      //   if (needsReinitialization) {
      //     console.log("Drag classes removed after save, reinitializing...");
      //     observer.disconnect();
      //     getInitialColors();
      //   }
      // });

      // observer.observe(tabPanel, {
      //   attributes: true,
      //   attributeFilter: ["class"],
      //   subtree: true,
      //   childList: true,
      // });

      // console.log("save flow, observer", observer);

      waitForElement(".tokens-editor-wrapper.colors", () => {
        handleTokenColors();
      });

      // After saving, update the initial order and hide the button
      saveButton.style.display = "none";
      const event = new CustomEvent("colorOrderChanged", {
        detail: { default: initialColorOrder },
      });
      document.dispatchEvent(event);
      console.log("save flow, dispatched event", event);
    });
  } catch (error) {
    console.error("there was an error", error);
  }
}

load();
