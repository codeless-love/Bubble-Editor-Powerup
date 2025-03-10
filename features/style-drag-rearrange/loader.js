window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️" + "Drag & Drop Style");
  let thisScriptKey = "style_drag_rearrange";
  /* You can ignore all the stuff on this line, but don't delete! */if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Create a new script element
  const script = document.createElement("script");
  console.log("❤️" + "loaded script", script);

  // Alternatively, if you have an external JS file, set the src attribute:

  // script.src = chrome.runtime.getURL("./drag.js");
  script.src = chrome.runtime.getURL("features/style-drag-rearrange/drag.js");
  //script.src = "./drag.js";

  // Append the script to the document (head or documentElement)
  console.log("❤️" + "head", document.head.appendChild(script));
  (document.head || document.documentElement).appendChild(script);
  // document.head.appendChild(script);

})();//👈👈 don't delete this, and don't put anything outside of this!!
