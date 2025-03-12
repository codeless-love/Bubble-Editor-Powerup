/* */ window.loadedCodelessLoveScripts ||= {};
/* */(function() {

const featureKey = "expression_collapser";// Replace this with your feature's  key (same as what's in features.json)
console.log("❤️"+"Expression Collapser");// Replace this with your feature's name

/* */   if (window.loadedCodelessLoveScripts[featureKey] === "loaded") {console.warn("❤️ Feature already loaded:", featureKey);return;}
/* */   window.loadedCodelessLoveScripts[featureKey] = "loaded";
/* */   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
/* */     if (message.action === "loadScript") {
/* */       console.log("❤️ Loaded feature ", message.featureKey);


// Insert collapser when .nested element is added
function insertCollapser(element) {
  // Ensure it's not already present
  if (element && !element.querySelector('.❤️collapser')) {
    const nestedAncestors = element.closestAll('.nested');  // Custom helper function to get all ancestors with '.nested'
    console.log("❤️"+nestedAncestors);
    if (nestedAncestors.length >= 2) {//dont show the first one
      const collapser = document.createElement('div');
      collapser.className = '❤️collapser';
      collapser.textContent = '⏷'; // Icon to represent collapse/expand
      element.insertBefore(collapser, element.firstChild);

      // Attach event listener to toggle the collapse
      collapser.addEventListener('click', function() {
        const parent = element.closest('.nested');
        if (parent) {
          parent.classList.toggle('❤️collapsed');
        }
        // Toggle the arrow icon between down and sideways
        if (parent.classList.contains('❤️collapsed')) {
          collapser.textContent = '⏵'; // Sideways arrow
        } else {
          collapser.textContent = '⏷'; // Down arrow
        }
      });
    }
  }
  sendResponse({ success: true });
}

// Initialize on page load
insertCollapser(document.querySelector(".nested"));

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

        // Because: .nested is not mutated directly, but .long-text-composer-wrapper is, so we have to catch that mutating and then get .nested out of it.
        // When exiting expression editor focus, only the <div style=display:inline> element is mutated, so we get it this way to re-draw the triangles.
        // In element condition expressions, it's .expression-composer that mutates
        if (node.matches('.long-text-composer-wrapper') || node.matches('.expression-composer > div:first-child') || node.matches('.expression-composer')) {
          // Look for .nested inside this node
          const nestedElements = node.querySelectorAll('.nested');
          nestedElements.forEach(nested => {
            insertCollapser(nested);
          });
        }

        // Because: When clicking on a part of the expression, .nested is mutated while .long-text-composer-wrapper is not.
        if (node.matches('.nested')) {
          insertCollapser(node);
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

/* */       return true;  // Asynchronous response
/* */     }
/* */   });
/* */ })();
