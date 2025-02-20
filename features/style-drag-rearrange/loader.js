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
    const sortableScript = document.createElement("script");
    sortableScript.src = chrome.runtime.getURL("utils/Sortable.min.js");
    sortableScript.type = "module";
    script.onload = () => {
      // Initial run
      console.log("loaded Sortable", Sortable);
      handleTokenColors();
    };
    document.head.appendChild(sortableScript);

    document.head.appendChild(script);
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
  console.log("found colorWrapper", colorWrapper);

  const sortableModule = await import(
    chrome.runtime.getURL("utils/Sortable.min.js")
  );
  // Some UMD bundles return the library as a default export, others attach it directly.
  const Sortable = sortableModule.default || sortableModule;
  console.log("Imported Sortable:", Sortable);

  // Initialize Sortable directly on the tokens-editor-wrapper
  let colorsSortable = Sortable(colorWrapper, {
    animation: 150,
    ghostClass: "sortable-ghost",
    dragClass: "sortable-drag",
    draggable: ".token-wrapper:not(.style-section-subtext)", // Only make token-wrapper elements draggable, except the subtext
    handle: ".token-caption", // Make it draggable by the caption
    dataIdAttr: "data-id",
    onEnd: (evt) => {
      let order = colorsSortable.toArray();
      console.log("New order:", order);
    },
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
