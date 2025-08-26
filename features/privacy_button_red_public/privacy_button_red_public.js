window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Privacy Status Badges");
  let thisScriptKey = "privacy_button_red_public";
  /* You can ignore all the stuff on this line, but don't delete! */ if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Function to check and style privacy elements
  function checkPrivacyElements() {
    // Find all privacy setting buttons and text elements
    const privacyButtons = document.querySelectorAll('.privacy-setting-btn.bubble-ui.light-grey-btn');
    const privacyTexts = document.querySelectorAll('.privacy-setting-text');
    
    // Combine both sets of elements
    const allPrivacyElements = [...privacyButtons, ...privacyTexts];
    
    allPrivacyElements.forEach(element => {
      const textContent = element.textContent ? element.textContent.trim() : '';
      
      // Check for "Publicly visible" - red badge
      if (textContent === "Publicly visible") {
        // Add red badge class and remove green badge class
        if (!element.classList.contains('is-public-visible')) {
          element.classList.add('is-public-visible');
        }
        if (element.classList.contains('is-privacy-applied')) {
          element.classList.remove('is-privacy-applied');
        }
      } 
      // Check for "Privacy rules applied" - green badge
      else if (textContent === "Privacy rules applied") {
        // Add green badge class and remove red badge class
        if (!element.classList.contains('is-privacy-applied')) {
          element.classList.add('is-privacy-applied');
        }
        if (element.classList.contains('is-public-visible')) {
          element.classList.remove('is-public-visible');
        }
      } 
      // Remove both classes if text doesn't match either
      else {
        if (element.classList.contains('is-public-visible')) {
          element.classList.remove('is-public-visible');
        }
        if (element.classList.contains('is-privacy-applied')) {
          element.classList.remove('is-privacy-applied');
        }
      }
    });
  }

  // Initial run
  checkPrivacyElements();
  
  // Set up a MutationObserver to watch for changes in the DOM
  const observer = new MutationObserver(function(mutations) {
    // Check if any mutations affected privacy buttons or their text content
    let shouldCheck = false;
    
    mutations.forEach(mutation => {
      // Check if the mutation affected text content
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        // Check if it's related to privacy elements
        const target = mutation.target;
        if (target.nodeType === Node.TEXT_NODE) {
          const parent = target.parentElement;
          if (parent && parent.classList && (parent.classList.contains('privacy-setting-btn') || parent.classList.contains('privacy-setting-text'))) {
            shouldCheck = true;
          }
        } else if (target.classList && (target.classList.contains('privacy-setting-btn') || target.classList.contains('privacy-setting-text'))) {
          shouldCheck = true;
        } else if (target.querySelector && (target.querySelector('.privacy-setting-btn') || target.querySelector('.privacy-setting-text'))) {
          shouldCheck = true;
        }
      }
      
      // Also check for added nodes that might contain privacy elements
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if ((node.classList && (node.classList.contains('privacy-setting-btn') || node.classList.contains('privacy-setting-text'))) ||
                (node.querySelector && (node.querySelector('.privacy-setting-btn') || node.querySelector('.privacy-setting-text')))) {
              shouldCheck = true;
            }
          }
        });
      }
    });
    
    // If we detected relevant changes, check the privacy elements
    if (shouldCheck) {
      checkPrivacyElements();
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    characterData: true
  });
})();