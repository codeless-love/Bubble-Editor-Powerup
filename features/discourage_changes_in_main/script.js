/* */ window.loadedCodelessLoveScripts ||= {};
/* */(function() {

const featureKey = "discourage_changes_in_main";// Replace this with your feature's  key (same as what's in features.json)
console.log("❤️"+"Discorage editing in Main");// Replace this with your feature's name

/* */   if (window.loadedCodelessLoveScripts[featureKey] === "loaded") {console.warn("❤️ Feature already loaded:", featureKey);return;}
/* */   window.loadedCodelessLoveScripts[featureKey] = "loaded";
/* */   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
/* */     if (message.action === "loadScript") {
/* */       console.log("❤️ Loaded feature ", message.featureKey);

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
      console.log("❤️"+"BranchIsMain class added to the root element.");
    }
  } else {
    if (document.body.classList.contains("BranchIsMain")) {
      document.body.classList.remove("BranchIsMain");
      console.log("❤️"+"BranchIsMain class removed from the root element.");
    }
    console.log("❤️"+`Version parameter detected: "${version}". BranchIsMain not added.`);
  }

  // After all tasks are done, send the response
  sendResponse({ success: true });
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

/* */       return true;  // Asynchronous response
/* */     }
/* */   });
/* */ })();
