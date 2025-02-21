window.loadedCodelessLoveScripts ||= {};

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

  const waitForElement = (selector, callback) => {
    const observer = new MutationObserver((mutationsList, observer) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        callback();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (document.querySelector(selector)) {
      // Check if element is already there on load
      observer.disconnect();
      callback();
    }
  };

  waitForElement(".tokens-editor-wrapper.colors", () => {
    console.log("waitForElement running");
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("features/style-drag-rearrange/drag.js");
    script.onload = () => {
      window.loadedCodelessLoveScripts[thisScriptKey] = "loaded"; // Set status to loaded after drag.js is loaded and executed
      console.log("❤️ " + thisScriptKey + " drag.js loaded and executed.");
    };
    document.head.appendChild(script);
    handleTokenColors();
  });
}

let shouldReRun = true;
let childNodeCount = 0;
let colorWrapperObserver;

async function handleTokenColors() {
  if (shouldReRun === false) return;
  console.log("handleTokenColors running");

  const colorWrapper = document.querySelector(".tokens-editor-wrapper.colors");
  if (!colorWrapper) return;

  // Add save button to the page (hidden by default)
  const saveButton = document.createElement("button");
  saveButton.id = "sortable-save-button";
  saveButton.innerHTML = "💾 Save New Order";
  saveButton.style.display = "none";
  document.body.appendChild(saveButton);

  // Store initial order
  let initialOrder;

  const sortableModule = await import(
    chrome.runtime.getURL("utils/Sortable.min.js")
  );

  // Get the Sortable constructor - try different ways of accessing it
  const SortableConstructor =
    sortableModule.Sortable || // Try direct named export
    sortableModule.default || // Try default export
    window.Sortable; // Try global

  if (!SortableConstructor) {
    console.error("Failed to load Sortable constructor", sortableModule);
    return;
  }

  console.log("Imported Sortable:", SortableConstructor);

  // Initialize Sortable directly on the tokens-editor-wrapper
  let colorsSortable = new Sortable(colorWrapper, {
    animation: 150,
    ghostClass: "sortable-ghost",
    dragClass: "sortable-drag",
    draggable: ".token-wrapper:has(.token-name-and-edit)", // Only make token-wrapper elements draggable, except the subtext
    handle: ".token-name-and-edit", // Make it draggable by the caption
    dataIdAttr: "data-id",
    onStart: () => {
      // Store initial order when drag starts
      if (!initialOrder) {
        initialOrder = colorsSortable.toArray();
      }
    },
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
    // Here you would implement the actual save logic
    console.log("Saving new order:", colorsSortable.toArray());
    // After saving, update the initial order and hide the button
    initialOrder = colorsSortable.toArray();
    saveButton.style.display = "none";
  });

  console.log("colorsSortable initialized", colorsSortable);
  shouldReRun = false;

  // Create observer if it doesn't exist
  if (!colorWrapperObserver) {
    colorWrapperObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const currentCount =
            colorWrapper.querySelectorAll(".token-wrapper").length;
          if (currentCount !== childNodeCount) {
            childNodeCount = currentCount;
            shouldReRun = true;
            handleTokenColors();
          }
        }
      });
    });

    colorWrapperObserver.observe(colorWrapper, {
      childList: true,
      subtree: true,
    });
  }
}

load();
