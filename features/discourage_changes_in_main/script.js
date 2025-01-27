window.loadedCodelessLoveScripts ||= {};
(function () { console.log("❤️"+"Discorage editing in Main");
  let thisScriptKey = "discourage_changes_in_main";
  console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} // Exit if the script has already been loaded
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
  console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Utility to extract query parameters from the URL
  function getQueryParam(param) {
    const url = new URL(window.location.href);
    return url.searchParams.get(param);
  }

  // Function to check the version and add/remove the class
  function applyBranchClass() {
    const version = getQueryParam("version");

    if (!version || version === "test") {
      if (!document.body.classList.contains("BranchIsMain")) {
        document.body.classList.add("BranchIsMain");
        console.log("BranchIsMain class added to the root element.");
      }
    } else {
      if (document.body.classList.contains("BranchIsMain")) {
        document.body.classList.remove("BranchIsMain");
        console.log("BranchIsMain class removed from the root element.");
      }
      console.log(`Version parameter detected: "${version}". BranchIsMain not added.`);
    }
  }

  // Watch for changes in the URL (for SPAs)
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;
      applyBranchClass();
    }
  });

  // Start observing changes to the document body
  observer.observe(document.body, { childList: true, subtree: true });

  // Run on initial load
  applyBranchClass();
})();
