window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Checkbox Label Click");
  let thisScriptKey = "checkbox_label_click";
  /* You can ignore all the stuff on this line, but don't delete! */ if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Function to add click handlers to checkbox labels
  function addCheckboxLabelClickHandlers() {
    // Process field captions (standard structure)
    processCheckboxLabels('.field-caption', caption => {
      const fieldWrapper = caption.closest('.field-wrapper');
      if (!fieldWrapper) return null;
      
      return fieldWrapper.querySelector('.component-checkbox');
    });
    
    // Process permission captions (permission structure)
    processCheckboxLabels('.permission-caption', caption => {
      const permissionDiv = caption.closest('.permission-div');
      if (!permissionDiv) return null;
      
      return permissionDiv.querySelector('.component-checkbox');
    });
  }
  
  // Helper function to process checkbox labels
  function processCheckboxLabels(selector, checkboxFinder) {
    // Find all captions matching the selector
    const captions = document.querySelectorAll(selector);
    
    captions.forEach(caption => {
      // Skip if we've already processed this caption
      if (caption.dataset.checkboxLabelClickEnabled) return;
      
      // Mark this caption as processed
      caption.dataset.checkboxLabelClickEnabled = "true";
      
      // Find the associated checkbox using the provided finder function
      const checkbox = checkboxFinder(caption);
      if (!checkbox) return;
      
      // Add click event listener to the caption
      caption.addEventListener('click', function(event) {
        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Simulate a click on the checkbox
        checkbox.click();
      });
    });
  }

  // Initial run
  addCheckboxLabelClickHandlers();
  
  // Set up a MutationObserver to watch for new elements being added to the DOM
  const observer = new MutationObserver(function(mutations) {
    // When DOM changes, check for new checkbox labels
    addCheckboxLabelClickHandlers();
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
})();