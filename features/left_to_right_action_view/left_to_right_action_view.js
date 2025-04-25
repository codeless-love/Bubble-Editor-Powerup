window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️"+"Name of feature goes here");
  let thisScriptKey = "feature_key_goes_here";

  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
  console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);


  function initialize() {
    console.log("❤️ Initializing left-to-right workflow window feature");

    // Set up a MutationObserver to watch for action preview window
    const observer = new MutationObserver((mutations) => {
      const workflowWindow = document.querySelector('div[data-name="preview"] div[role="button"] + div');
      if (workflowWindow) {
        applyCustomStyles();
      }
    });

    // Find the action editor or wait for it
    const actionEditor = document.querySelector('.action-editor');
    if (actionEditor) {
      observer.observe(actionEditor, {
        childList: true,
        subtree: true
      });
    } else {
      // If action editor isn't available yet, watch for it to be added
      const parentObserver = new MutationObserver((mutations, observer) => {
        const actionEditor = document.querySelector('.action-editor');
        if (actionEditor) {
          observer.disconnect();
          // Start observing the action editor
          applyCustomStyles();
          console.log('❤️ Found action editor, left-to-right mode should be applied correctly now.')
          observer.observe(actionEditor, {
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


  function applyCustomStyles() {
    const target = document.querySelector('div[data-name="preview"] div[role="button"] + div');
  
    if (!target) return;
  
    target.style.setProperty('flex-direction', 'row', 'important');
    target.style.setProperty('flex-wrap', 'wrap', 'important');
    target.style.setProperty('align-items', 'stretch', 'important');
    target.style.setProperty('justify-content', 'start', 'important');
    target.style.setProperty('row-gap', '20px', 'important');
    target.style.setProperty('padding', '20px', 'important');
    target.style.setProperty('padding-bottom', '120px', 'important');
  
    const childElements = target.children;
    for (let i = 0; i < childElements.length; i++) {
      const child = childElements[i];
  
      if (!child.getAttribute("role")) {
        child.style.setProperty('align-items', 'stretch', 'important');
        let nestedChildren = Array.from(child.querySelectorAll('div, span'));
        for (let j = 0; j < nestedChildren.length; j++) {
          const nested = nestedChildren[j];
          if (nested.getAttribute("aria-label") === 'Drag handle'){
            nested.style.setProperty('align-self', 'center', 'important');
            nested.style.setProperty('max-height', '12px', 'important');
            continue;
          } 
  
          nested.style.setProperty('display', 'flex', 'important');
          nested.style.setProperty('height', '100%', 'important');
          nested.style.setProperty('align-items', 'stretch', 'important');
  
          if (nested.style.position === 'absolute' && nested.style.top === '4px') {
            nested.style.setProperty('position', 'relative', 'important');
          }

          if (nested.tagName === 'SPAN' && nested.classList.contains('_1ox6jxm6')) {
            const item1 = nested.children[0]?.children[1];
            const item2 = nested.children[0]?.children[2];
          
            if (item1 && item2) {
              const newItems1 = Array.from(item1.querySelectorAll('div'));
              const newItems2 = Array.from(item2.querySelectorAll('div'));
              nestedChildren.splice(j + 1, 0, ...newItems1, ...newItems2);
            }
          }
  
          if (nested.classList.contains('_5r6zug0')) {
            break;
          }
        }
      } else {
        child.style.setProperty('align-self', 'center', 'important');
        child.style.setProperty('rotate', '270deg', 'important');
        child.style.setProperty('margin', '15px', 'important');
      }
    }
  }
  
  const style = document.createElement('style');
  style.textContent = `
  ._1nfonn86._1lkv1fw9._1lkv1fwb._1ij2r33{
  margin-top: 10px !important;
  margin-bottom: 5px !important;
  }
  ._1nfonn86._1lkv1fw9._1lkv1fwd._1ij2r31{
  margin-top: 5px !important;
  }
`;
  document.head.appendChild(style);

  applyCustomStyles();

})();
