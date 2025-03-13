/* */ window.loadedCodelessLoveScripts ||= {};
/* */(function() {

const featureKey = "feature_key_goes_here";// Replace this with your feature's  key (same as what's in features.json)
console.log("❤️"+"Example Feature Name");// Replace this with your feature's name

/* */   if (window.loadedCodelessLoveScripts[featureKey] === "loaded") {console.warn("❤️ Feature already loaded:", featureKey);return;}
/* */   window.loadedCodelessLoveScripts[featureKey] = "loaded";
/* */   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
/* */     if (message.action === "runScript") {
/* */       console.log("❤️ Loaded feature ", message.featureKey);



// Put your feature's JavaScript here. Scripts run here are in an isolated world separate from the main world of the tab.


// If you need to run code in the main world, create a separate js file and use this to inject it into the main world. You can run multiple of these to inject multiple files. 
// chrome.runtime.sendMessage({
//     action: "injectScriptIntoMainWorld",//don't change this
//     jsFile: "features/feature_key_goes_here/scriptForMainWorld.js"//replace this with the path to scripts you need to inject.
//});


// after your script is 100% done executing, run this: (it might need to get moved into a function)
sendResponse({ success: true });


/* */       return true;  // Asynchronous response
/* */     }
/* */   });
/* */ })();
