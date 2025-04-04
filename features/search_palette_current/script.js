window.loadedCodelessLoveScripts ||= {};
(function() {
  let thisScriptKey = "search_palette_current";

  /* ------------------------------------------------ */
  /* ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ Don't mess with this  ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ */
  /* ------------------------------------------------ */
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
  console.log("❤️ " + thisScriptKey + "loaded successfully");
  /* ------------------------------------------------ */
  /* ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ Don't mess with this  ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ */
  /* ------------------------------------------------ */


  // Function to add click handlers to result divs
  function addResultDivClickHandlers() {
    console.log("❤️ Adding click handlers to result divs");
    const resultDivs = document.querySelectorAll('.result-area.overview .result-div');
    
    resultDivs.forEach(div => {
      // Skip if we've already processed this div
      if (div.dataset.clickHandlerAdded) return;
      
      // Mark this div as processed
      div.dataset.clickHandlerAdded = "true";
      
      div.addEventListener('click', function() {
        console.log("❤️ Result div clicked");
        // Remove 'current' class from all result divs
        document.querySelectorAll('.result-area.overview .result-div').forEach(d => 
          d.classList.remove('current')
        );
        
        // Add 'current' class to clicked div
        this.classList.add('current');
      });
    });
  }

  function initialize() {
    console.log("❤️ Initializing search palette current feature");
    
    // Set up a MutationObserver to watch for new result divs
    const observer = new MutationObserver((mutations) => {
      const searchPalette = document.querySelector('.search-palette');
      if (searchPalette?.querySelector('.result-list')) {
        addResultDivClickHandlers();
      }
    });
    
    // Find the search palette or wait for it
    const searchPalette = document.querySelector('.search-palette');
    if (searchPalette) {
      observer.observe(searchPalette, { 
        childList: true, 
        subtree: true 
      });
    } else {
      // If search palette isn't available yet, watch for it to be added
      const parentObserver = new MutationObserver((mutations, observer) => {
        const searchPalette = document.querySelector('.search-palette');
        if (searchPalette) {
          observer.disconnect();
          // Start observing the search palette
          observer.observe(searchPalette, { 
            childList: true, 
            subtree: true 
          });
        }
      });
      
      parentObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

})();//👈👈 don't delete this, and don't put anything outside of this!!
