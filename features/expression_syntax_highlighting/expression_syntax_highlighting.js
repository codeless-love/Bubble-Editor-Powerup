window.loadedCodelessLoveScripts ||= {};
(function() { console.log("❤️"+"Expression Syntax Highlighting");
let thisScriptKey = "expression_syntax_highlighting";
if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} // Exit if the script has already been loaded
window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  let debounceTimeout;
  let isProcessing = false; // Flag to prevent redundant processing

  function initializeHighlighting() {
    highlightSyntax();
    setupObserver();
  }

  initializeHighlighting();

  // Function to apply syntax highlighting
  function highlightSyntax() {
    if (isProcessing) return; // If already processing, do nothing
    isProcessing = true; // Set flag to indicate processing

    // Find all `.nested` elements that may contain the pattern
    const nestedContainers = document.querySelectorAll('div.nested');

    nestedContainers.forEach(container => {
      // Get all `span.dynamic` elements within this container
      const dynamicSpans = container.querySelectorAll('span.dynamic');
      
      const comparisonOperators = new Set([
        'is', 'is not', '<>', 'is empty', 'is not empty', 'is in', 'is not in',
        'contains', "doesn't contain", 'contains keyword(s)', "doesn't contain keyword(s)",
        '>', '≥', '<', '≤',
        'contains range', 'contains point', 'is contained by', 'overlaps with',
        'is greater', 'is greater (point)', 'is smaller', 'is smaller (point)',
        'Equals rounded down',
        'contains (point)', 'is after', 'is after (point)', 'is before', 'is before (point)',
        'is "yes"', 'is "no"', 'is yes', 'is no',
        'contains list', "doesn't contain", "doesn't contains", // Typo from Bubble docs
        'is clickable', "isn't clickable", "is hovered", "isn't hovered", "is pressed]", "isn't pressed", "is visible", "isn't visible",
        'is logged in', 'has an account', "isn't logged in", "doesn't have an account", 'uses password', 'uses 2FA', 'has 2FA backup codes', 'is using cookies', 'User is subscribed to…'
      ]);

      // Iterate through the spans to check for the specific pattern
      for (let i = 0; i < dynamicSpans.length; i++) {
        // SYNTAX HIGHLIGHTING: Add classes for different expression components

        // *   **Color 1 (e.g., Blue):** All **Data Sources** (`Current User`).
        // *   **Color 2 (e.g., Cyan):** All **Property Accessors** (`'s unique id`).
        // *   **Color 3 (e.g., Green):** All **Chained Operators** (`:formatted as`, `:count`).
        // *   **Color 4 (e.g., Purple):** All **Infix Operators** (`is`, `+`, `merged with`).
        // *   **Color 5 (e.g., Red):** All **Logical** (`and`, `or`).
        // *   **Color 5 (e.g., Magenta):** All **Comparison** (`is`, `contains`).
        // *   **Color 6 (e.g., Orange):** Literals and static values (text strings, numbers).

        const currentSpan = dynamicSpans[i];
        const text = currentSpan.textContent.trim();

        // Property Accessors
        if (text.startsWith("'s")) {
            currentSpan.classList.add('❤️property');
        } else if (text.startsWith(':')) { // Chained Operators
            currentSpan.classList.add('❤️chained');
        } else if (text === 'and' || text === 'or') { // Logical Operators
            currentSpan.classList.add('❤️logical');
        } else if (comparisonOperators.has(text)) { // Comparison Operators
            currentSpan.classList.add('❤️comparison');
        }
      }
    });
    isProcessing = false; // Reset flag after processing
  }

  function setupObserver() {
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
                highlightSyntax(); // Run the function to apply syntax highlighting
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
  }

  // Polyfill for closestAll to get all ancestors with a specific class
  if (!Element.prototype.closestAll) {
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
  }
})();
