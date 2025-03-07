window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Folder Click Toggle");
  let thisScriptKey = "folder_click_toggle";
  /* You can ignore all the stuff on this line, but don't delete! */ console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Function to add click handlers to folder items
  function addFolderClickHandlers() {
    // Find all folder items in the document
    const folderItems = document.querySelectorAll('div[data-name="FolderItem"]');
    
    folderItems.forEach(folderItem => {
      // Skip if we've already processed this folder item
      if (folderItem.dataset.clickToggleEnabled) return;
      
      // Mark this folder item as processed
      folderItem.dataset.clickToggleEnabled = "true";
      
      // Add click event listener to the folder item
      folderItem.addEventListener('click', function(event) {
        // Don't handle clicks on the caret itself (let the default behavior work)
        if (event.target.closest('[aria-label="Caret"]') || 
            event.target.closest('svg') || 
            event.target.tagName === 'path') {
          return;
        }
        
        // Find the caret button within this folder item
        const caretButton = this.querySelector('[aria-label="Caret"]');
        
        // If found, simulate a click on the caret
        if (caretButton) {
          event.preventDefault();
          event.stopPropagation();
          caretButton.click();
        }
      });
    });
  }

  // Initial run
  addFolderClickHandlers();
  
  // Set up a MutationObserver to watch for new folder items being added to the DOM
  const observer = new MutationObserver(function(mutations) {
    // When DOM changes, check for new folder items
    addFolderClickHandlers();
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
})();