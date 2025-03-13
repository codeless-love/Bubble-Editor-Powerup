/* */ window.loadedCodelessLoveScripts ||= {};
/* */(function() {

const featureKey = "style_drag_rearrange";// Replace this with your feature's  key (same as what's in features.json)
console.log("❤️"+"Drag Styles to Rearrange");// Replace this with your feature's name

/* */   if (window.loadedCodelessLoveScripts[featureKey] === "loaded") {console.warn("❤️ Feature already loaded:", featureKey);return;}
/* */   window.loadedCodelessLoveScripts[featureKey] = "loaded";
/* */   chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
/* */     if (message.action === "runScript") {
/* */       console.log("❤️ Loaded feature ", message.featureKey);



// Put your feature's JavaScript here. Scripts run here are in an isolated world separate from the main world of the tab.


//if you need to inject a script into the "main world" (the actual tab context), do it like this:
chrome.runtime.sendMessage({
    action: "injectScriptIntoMainWorld",
    jsFile: "features/style-drag-rearrange/style-drag-rearrange.js"
});


// after your script is 100% done executing, run this: (it might need to get moved into a function)
sendResponse({ success: true });


/* */       return true;  // Asynchronous response
/* */     }
/* */   });
/* */ })();
