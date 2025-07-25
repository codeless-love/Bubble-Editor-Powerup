window.loadedCodelessLoveScripts ||= {};
(function() { console.log("❤️"+"Bad Practice Warning");
let thisScriptKey = "expression_bad_practice_warning";
if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} // Exit if the script has already been loaded
window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

// Store warning preferences
let warningPrefs = {
  countIsZero: true,
  currentUserInBackend: true,
  publicAPIChecked: true,
  zeroWidth: true,
};

  // Load preferences first, then initialize
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get([
      'expression_bad_practice_warning_count_is_zero',
      'expression_bad_practice_warning_current_user_in_backend',
      'expression_bad_practice_warning_public_api_checked',
      'expression_bad_practice_warning_zero_width',
    ], (result) => {
      warningPrefs.countIsZero = result.expression_bad_practice_warning_count_is_zero === true;
      warningPrefs.currentUserInBackend = result.expression_bad_practice_warning_current_user_in_backend === true;
      warningPrefs.publicAPIChecked = result.expression_bad_practice_warning_public_api_checked === true;
      warningPrefs.zeroWidth = result.expression_bad_practice_warning_zero_width === true;

      // Only initialize after preferences are loaded
      initializeDetection();
    });
  } else {
    // Use default values when chrome.storage is not available
    console.log("❤️"+"Chrome storage not available, using default warning preferences:", warningPrefs);
    initializeDetection();
  }

  function initializeDetection() {
    detectBadPractices();
    setupObserver();
  }

  let debounceTimeout;
  let isProcessing = false; // Flag to prevent redundant processing

  // Outline and add a warning to detected bad practices
  function addWarning(nodes, warningTagNode, practiceName, practiceURL, warningText = 'Warning', level = 'warning') {
    if (!Array.isArray(nodes) || nodes.length === 0) return;

    // Iterate through the list of nodes to add dashed outline classes
    nodes.forEach((node, index) => {
      if (!node) return; // Skip null or undefined nodes

      // Add the general warning class and level class to all
      node.classList.add('❤️expression-warning', `level-${level}`);

      // Add specific classes for the first/last nodes. if there's only one node, add both classes
      if (index === 0) {
        node.classList.add('❤️expression-warning-left');
      }
      if (index === nodes.length - 1) {
        node.classList.add('❤️expression-warning-right');
      }
    });

    // Add the warning tag to the specified node
    if (!warningTagNode.querySelector('.❤️expression-warning-tag')) {
      const warningDiv = document.createElement('div');
      warningDiv.textContent = warningText;
      warningDiv.className = `❤️expression-warning-tag level-${level}`;
      if(practiceURL){
        warningDiv.dataset.codelessLovePractice = practiceURL;
        warningDiv.setAttribute(
          'onpointerdown',
          `event.preventDefault(); window.open("${practiceURL}", "_blank");`
        );
      }
      warningTagNode.appendChild(warningDiv);
    }
  }

  // Remove warning classes and tags from nodes
  function removeWarning(nodes, warningTagNode) {
    if (!Array.isArray(nodes) || nodes.length === 0) return;

    // Remove classes from all nodes
    nodes.forEach(node => {
      if (!node) return;
      node.classList.remove('❤️expression-warning');
      node.classList.remove('❤️expression-warning-left');
      node.classList.remove('❤️expression-warning-right');
      node.classList.remove('level-bad');
      node.classList.remove('level-warning');
      node.classList.remove('level-info');
    });

    // Remove warning tag
    const warningTag = warningTagNode.querySelector('.❤️expression-warning-tag');
    warningTag?.remove();
  }

  // Function to detect bad practices
  function detectBadPractices() {
    if (isProcessing) return; // If already processing, do nothing
    isProcessing = true; // Set flag to indicate processing

    // Find all `.nested` elements that may contain the pattern
    const nestedContainers = document.querySelectorAll('div.nested');

    nestedContainers.forEach(container => {
      // Get all `span.dynamic` elements within this container
      const dynamicSpans = container.querySelectorAll('span.dynamic');

      // Iterate through the spans to check for the specific pattern
      for (let i = 0; i < dynamicSpans.length; i++) {
        const url = new URL(window.location.href);
        const firstItem  = dynamicSpans[i];
        const secondItem = dynamicSpans[i + 1] ?? null;//if we're near the end of the list, these may not exist, so avoid an error by passing null if it isn't there.
        const thirdItem  = dynamicSpans[i + 2] ?? null;
        const fourthItem = dynamicSpans[i + 3] ?? null;
        //console.log("❤️"+firstItem.textContent);

        // BAD PRACTICE: :count is 0 - Only check if this warning is enabled
        if (warningPrefs.countIsZero) {
          const searchItem = firstItem;
          const countItem = secondItem;
          const comparisonItem = thirdItem;
          const zeroItem = fourthItem;
          const validOperators = ['is', 'is not', '>', '<', '≤', '≥'];

          if (
            searchItem?.textContent.match("Search for") &&
            countItem?.textContent.trim() === ':count' &&
            validOperators?.includes(comparisonItem.textContent.trim()) &&
            zeroItem?.textContent.trim() === '0'
          ) {
            console.log("❤️"+'Bad practice detected: ":count is 0"');
            addWarning(
              [searchItem, countItem, comparisonItem, zeroItem],
              zeroItem,
              ":count is 0",
              "https://codeless.love/practice?practice=determine-if-a-list-is-empty",
              "Bad Practice"
            );
          }
        }

        // WARNING PRACTICE: Current User in BackendWorkflows - Only check if this warning is enabled
        if (warningPrefs.currentUserInBackend) {
          if (
            firstItem.textContent.includes("Current User") &&
            url.searchParams.get('tab') === 'BackendWorkflows'
          ) {
            console.log("❤️"+'Warning: "Current user in Backend workflows tab"');
            addWarning([firstItem],
              firstItem,
              "Current User used in Backend",
              null,
              "Warning",
              "warning"
            );
          }
        }
      }
    });
    isProcessing = false; // Reset flag after processing

    // WARNING PRACTICE: Public API Checkbox - Only check if this warning is enabled
    if (warningPrefs.publicAPIChecked) {
      // Find the expose checkbox contItainer
      const exposeElement = document.querySelector("[prop_name=expose]");
      if (exposeElement) {
        const isChecked = exposeElement.querySelector('.component-checkbox.property-editor-control.checked');
        
        if (isChecked) {
          console.log("❤️"+'Warning: "Public API workflow is checked"');
          addWarning(
            [exposeElement],
            exposeElement,
            "Public API is checked",
            null,
            "Warning"
          );
        }
      }
    }

    // WARNING: Width set to zero
    if (warningPrefs.zeroWidth) {
      const widthElement = document.querySelector("[prop_name=max_width_css]");
      if (widthElement) {
        const input = widthElement.querySelector('input.composer-input.number-input');
        
        // Add input event listener for immediate response
        input?.addEventListener('input', () => {
          const isZero = input.value === "0";
          if (isZero) {
            addWarning(
              [widthElement],
              widthElement,
              "Width is set to 0",
              null,
              "Warning"
            );
          } else {
            removeWarning([widthElement], widthElement);
          }
        });

        // Initial check
        const isZero = input?.value === "0";
        if (isZero) {
          addWarning(
            [widthElement],
            widthElement,
            "Width is set to 0",
            null,
            "Warning"
          );
        }
      }
    }
  }

  // Initial detection on page load
  // insertCollapser(document.querySelector(".nested"));

  // Set up a MutationObserver to watch for DOM changes (with debounce)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Check if the node is an element node (not text or comment node)
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if the node's class list contains a class with ❤️
          if (Array.from(node.classList).some(className => className.includes('❤️'))) {
            // If a class with ❤️ is found, it is something we just inserted. If we insert again, it will cause an infinite loop.
            return;
          }

          // Check if nodes were added or modified
          if (!isProcessing && mutation.type === 'childList' || mutation.type === 'subtree') {
            // Clear the previous timeout if there is one
            clearTimeout(debounceTimeout);
            // Set a new timeout to run the function after a short delay
            debounceTimeout = setTimeout(() => {
              detectBadPractices(); // Run the function to check for bad practices
            }, 300);
          }
        }
      });
    });
  });

  // Start observing the body or a specific parent element
  observer.observe(document.body, {
    childList: true, // Watch for child nodes being added/removed
    subtree: true,   // Watch within all descendant nodes
    characterData: true // Watch for text content changes
  });

  // Polyfill for closestAll to get all ancestors with a specific class
  Element.prototype.closestAll = function(selector) {
    let ancestors = [];
    let currentElement = this;
    while (currentElement) {
      if (currentElement.matches(selector)) {
        ancestors.push(currentElement);
      }
      currentElement = currentElement.parentElement;
    }
    return ancestors;
  };
})();
