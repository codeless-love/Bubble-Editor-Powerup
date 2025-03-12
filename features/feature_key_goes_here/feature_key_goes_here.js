/* */ window.loadedCodelessLoveScripts ||= {};
/* */(function() {

const featureKey = "feature_key_goes_here";// Replace this with your feature's  key (same as what's in features.json)
console.log("❤️"+"Example Feature Name");// Replace this with your feature's name

/* */   if (window.loadedCodelessLoveScripts[featureKey] === "loaded") {console.warn("❤️ Feature already loaded:", featureKey);return;}
/* */   window.loadedCodelessLoveScripts[featureKey] = "loaded";
/* */   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
/* */     if (message.action === "loadScript") {
/* */       console.log("❤️ Loaded feature ", message.featureKey);



// Put your feature's JavaScript here


// after your script is 100% done executing, run this:
sendResponse({ success: true });


/* */       return true;  // Asynchronous response
/* */     }
/* */   });
/* */ })();
