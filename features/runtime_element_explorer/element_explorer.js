window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️Debugger App ID Button feature loaded");
  let thisScriptKey = "debugger_app_id_button";

  /* ------------------------------------------------ */
  /* ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ Don't mess with this  ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ */
  /* ------------------------------------------------ */
  if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
    console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
    return;
  }
  window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
  console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);
  /* ------------------------------------------------ */
  /* ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ Don't mess with this  ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ */
  /* ------------------------------------------------ */

  /* ------------------------------------------------------------------- */
  // INSTRUCTIONS
  //
  // 1. If your feature is CSS only, delete this file.
  // 2. Replace the example text on line 3with the name of your feature on line 3 of this file.
  // 3. Replace the example key on line 4 with your feature's script (snake_case preferred) on line 4 of this file.
  // 4. Insert any Javascript here. Don't put anything after the })(); at the end.
  // 5. Delete the "main world" injection demo code on lines 32-36, and delete the example script as well.
  /* ------------------------------------------------------------------- */


  // Only activate if debug_mode=true is in the URL
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug_mode") !== "true") {
    return;
  }

  // --- Inspector Button and Hover Logic ---

  function removeAllCurrentBubbleElementHighlights() {
    document.querySelectorAll('.currentBubbleElement').forEach(el => {
      el.classList.remove('currentBubbleElement');
    });
  }

  function attachInspectorCloseHandler(elProperties) {
    const closeBtn = elProperties.querySelector('.codelesslove-inspector-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        console.log("Inspector close button clicked");
        elProperties.classList.add('codelesslove-hidden');
        inspectorActive = false;
        document.body.classList.remove('crosshair-cursor');
        document.removeEventListener('mouseover', onHoverElement, true);
        document.removeEventListener('mouseout', onUnhoverElement, true);
        document.removeEventListener('click', onClickElement, true);
        removeAllCurrentBubbleElementHighlights();
        // Clear the inspector body but keep the header
        const header = elProperties.querySelector('.codelesslove-inspector-header');
        elProperties.innerHTML = '';
        if (header) elProperties.appendChild(header);
        // Re-attach close handler to the header (in case DOM is replaced)
        attachInspectorCloseHandler(elProperties);
      };
    }
  }

  function insertPropertiesDiv(topBar) {
    const elProperties = document.createElement('div');
    elProperties.id = 'codelessloveElementProperties';
    elProperties.className = 'codelesslove-properties-div codelesslove-hidden';

    // Always insert the inspector header
    const logoUrl = chrome.runtime.getURL('extension-icons/icon-21.png');
    elProperties.innerHTML = `<div class="codelesslove-inspector-header"><span class="codelesslove-header-group"><img class="codelesslove-logo" src="${logoUrl}" alt="Codeless Love Icon" />🐝</span><span class="codelesslove-inspector-title">Bubble Element Explorer</span><button class="codelesslove-inspector-close" title="Close">×</button></div>`;
    attachInspectorCloseHandler(elProperties);

    // Make the inspector draggable ONLY from the header, and ignore pointer events from inside the inspector
    elProperties.addEventListener('pointerdown', function(e) {
      const header = elProperties.querySelector('.codelesslove-inspector-header');
      // Only allow drag if pointerdown is on the header, not on a button or link
      if (!header || !header.contains(e.target) || e.target.closest('button, a')) return;
      // Prevent inspector event listeners from interfering with drag
      e.stopPropagation();
      header.classList.add('codelesslove-grabbing');
      elProperties.classList.add('codelesslove-inspector-dragging');
      // Use clientX/clientY and offsetLeft/offsetTop for fixed positioning
      const ox = e.clientX - elProperties.offsetLeft;
      const oy = e.clientY - elProperties.offsetTop;
      elProperties.style.position = 'fixed';
      document.onpointermove = e2 => {
        Object.assign(elProperties.style, {
          left: `${e2.clientX - ox}px`,
          top: `${e2.clientY - oy}px`,
          right: "unset",
          bottom: "unset"
        });
      };
      document.onpointerup = () => {
        document.onpointermove = null;
        document.onpointerup = null;
        header.classList.remove('codelesslove-grabbing');
        elProperties.classList.remove('codelesslove-inspector-dragging');
      };
    });

    topBar.appendChild(elProperties);
  }

  function insertInspectorButton() {
    const topBar = document.querySelector('.debugger-canvas .top-bar');
    if (!topBar) {
      setTimeout(insertInspectorButton, 500);
      return;
    }
    if (topBar.querySelector('.codelesslove-inspector-btn')) return;
    insertPropertiesDiv(topBar);
    const btn = document.createElement('button');
    btn.textContent = '❤️ Inspect Element';
    btn.className = 'codelesslove-inspector-btn';
    btn.onclick = toggleInspector;
    topBar.appendChild(btn);
  }

  let inspectorActive = false;
  let lastInspectedEl = null;

  function toggleInspector() {
    const propDiv = document.getElementById('codelessloveElementProperties');
    inspectorActive = !inspectorActive;
    if (inspectorActive) {
      propDiv.classList.remove('codelesslove-hidden');
      propDiv.style.maxWidth = (window.innerWidth - 20) + "px";
      document.body.classList.add('crosshair-cursor');
      document.addEventListener('mouseover', onHoverElement, true);
      document.addEventListener('mouseout', onUnhoverElement, true);
      document.addEventListener('click', onClickElement, true);
      // Reset inspector body to default prompt
      const header = propDiv.querySelector('.codelesslove-inspector-header');
      propDiv.innerHTML = '';
      if (header) propDiv.appendChild(header);
      const prompt = document.createElement('div');
      prompt.className = 'codelesslove-inspector-body';
      prompt.innerHTML = '<em>Click an element to inspect.</em>';
      propDiv.appendChild(prompt);
      attachInspectorCloseHandler(propDiv);
    } else {
      propDiv.classList.add('codelesslove-hidden');
      document.body.classList.remove('crosshair-cursor');
      document.removeEventListener('mouseover', onHoverElement, true);
      document.removeEventListener('mouseout', onUnhoverElement, true);
      document.removeEventListener('click', onClickElement, true);
      removeAllCurrentBubbleElementHighlights();
      // Clear inspector body but keep the header
      const header = propDiv.querySelector('.codelesslove-inspector-header');
      propDiv.innerHTML = '';
      if (header) propDiv.appendChild(header);
      attachInspectorCloseHandler(propDiv);
    }
  }

  function isAlternateA(str) {
    // Heuristic: Bubble sometimes uses alternating a/A in IDs
    // e.g. baTaVaDaG0
    return str.length >= 6 && str[1] === 'a' && str[3] === 'a' && str[5] === 'a';
  }

  function extractBubbleIdFromClassList(classList, el) {
    for (const className of classList) {
      let stripped = className.replace(/a/g, "");
      const altPattern = isAlternateA(className.slice(0, 6));
      const isDataId = /^a\d+x\d+$/.test(className);// e.g. a123x456 etc.
      if (altPattern || isDataId) {
        return stripped;
      }
    }
    return null;
  }

  function findElementIdFromDOM(el) {
    while (el) {
      const bubbleId = extractBubbleIdFromClassList(el.classList, el);
      if (bubbleId) return bubbleId;
      el = el.parentElement;
    }
    return null;
  }

  function activateInspector() {
    if (inspectorActive) return;
    inspectorActive = true;
    document.body.classList.add('crosshair-cursor'); // Use class
    document.addEventListener('mouseover', onHoverElement, true);
    document.addEventListener('mouseout', onUnhoverElement, true);
    document.addEventListener('click', onClickElement, true);
  }

  function onHoverElement(e) {
    const propDiv = document.getElementById('codelessloveElementProperties');
    if (propDiv && propDiv.contains(e.target)) return;
    const el = e.target;
    const bubbleId = findElementIdFromDOM(el);
    if (bubbleId) {
      el.classList.add('currentBubbleElement');
      lastInspectedEl = el;
    }
  }

  function onUnhoverElement(e) {
    const propDiv = document.getElementById('codelessloveElementProperties');
    if (propDiv && propDiv.contains(e.target)) return;
    if (lastInspectedEl) {
      lastInspectedEl.classList.remove('currentBubbleElement');
      lastInspectedEl = null;
    }
  }

  function onClickElement(e) {
    const propDiv = document.getElementById('codelessloveElementProperties');
    if (propDiv && propDiv.contains(e.target)) return;
    const el = e.target;
    const bubbleId = findElementIdFromDOM(el);
    if (bubbleId) {
      e.preventDefault();
      e.stopPropagation();
      // Request info from main world
      window.postMessage({
        source: "content-script",
        action: "getElementInfo",
        payload: { elementId: bubbleId }
      }, "*");
      // Do NOT hide or deactivate the inspector here!
    }
  }
  function getTypeDisplay(bubbleType) {
    switch (bubbleType) {
      case "CustomElement":
      case "CustomDefinition":
        return "Reusable";
      case "Brenton":
        return "Awesome";
      case "":
      case null:
      case undefined:
        return "No Type";
      default:
        return bubbleType;
    }
  }

  // Listen for info from main world
  window.addEventListener('message', (event) => {
    if (
      event.source === window &&
      event.data &&
      event.data.action === 'elementInfoResult'
    ) {
      const info = event.data.payload?.info;
      const propDiv = document.getElementById('codelessloveElementProperties');
      if (!propDiv) return;
      // Remove highlight from any previously highlighted element
      document.querySelectorAll('.currentBubbleElement').forEach(el => {
        el.classList.remove('currentBubbleElement');
      });
      // Highlight the new element by matching class with regex
      if (info && info.element_id) {
        // Build regex: match class with an 'a' inserted every other character
        // e.g. id = bTIVR0 => class = baTaIaVaRa0
        const id = info.element_id;
        let regexStr = id.split('').map(ch => `a?${ch}`).join('');
        const classRegex = new RegExp(`\\b${regexStr}\\b`);
        // Find all elements and add highlight to the first match
        const allEls = document.querySelectorAll('[class]');
        for (const el of allEls) {
          for (const cls of el.classList) {
            if (classRegex.test(cls)) {
              el.classList.add('currentBubbleElement');
              break;
            }
          }
        }
      }
      if (info && info.element) {
        const versionMatch = window.location.href.match(/\/version-([a-zA-Z0-9_-]+)/);
        const version = versionMatch ? versionMatch[1] : "live";
        const editorURL = `https://bubble.io/page?id=${info.app_id}&version=${version}&tab=Design&type=custom&name=${info.ru_name}&elements=${info.element.id}`;

        let html = '<section class="codelesslove-inspector-body">';
        if (info && info.parent && info.parent.id) {
          const parentType = getTypeDisplay(info.parent.type);
          const parentName = info.parent.name || info.parent.default_name || '(no name)';
          let parentRow = '<div class="codelesslove-prop-row"><span class="codelesslove-prop-name">';
          if (parentType === "Page" || parentType === "Reusable") {
            parentRow += parentName;
          } else {
            parentRow += `↑ <a href="#" class="codelesslove-inspect-element" data-element-id="${info.parent.id}">${parentName}</a>`;
          }
          parentRow += `</span><span class="codelesslove-prop-type">[${parentType}]</span></div>`;
          html += `<div class="codelesslove-prop-group"><h4 class="codelesslove-prop-label">Parent</h4>${parentRow}</div>`;
        }
        html += `<div class="codelesslove-prop-group"><h4 class="codelesslove-prop-label">Element</h4><div class="codelesslove-prop-row">→<a href="${editorURL}" target="_blank" class="codelesslove-prop-name">${info.element.name || info.element.default_name || '(no name)'}</a><span class="codelesslove-prop-type">[${getTypeDisplay(info.element.type)}]</span></div></div>`;
        if (info.element.elements) {
          html += `<div class="codelesslove-prop-group"><h4 class="codelesslove-prop-label">Children (${Object.entries(info.element.elements).length})</h4>` +
            Object.entries(info.element.elements).map(el => {
              const child = el[1];
              return `<div class="codelesslove-prop-row"><span class="codelesslove-prop-name">↓ <a href="#" class="codelesslove-inspect-element" data-element-id="${child.id}">${child.name || child.default_name}</a></span><span class="codelesslove-prop-type">[${getTypeDisplay(child.type)}]</span></div>`;
            }).join('') + `</div>`;
        }
        if (info && info.ru_name) {
          html += `<div class="codelesslove-prop-group"><h4 class="codelesslove-prop-label">Reusable</h4><div class="codelesslove-prop-row">${info.ru_chain.join(" &gt; ")}</div></div>`;
        }
        html += `</section>`
        propDiv.innerHTML = propDiv.querySelector('.codelesslove-inspector-header').outerHTML + html;
        attachInspectorCloseHandler(propDiv);
        if (inspectorActive) {
          propDiv.classList.remove('codelesslove-hidden');
        } else {
          propDiv.classList.add('codelesslove-hidden');
        }
        // Add click listeners for parent/children links
        propDiv.querySelectorAll('.codelesslove-inspect-element').forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            const elementId = this.getAttribute('data-element-id');
            if (elementId) {
              window.postMessage({
                source: "content-script",
                action: "getElementInfo",
                payload: { elementId }
              }, "*");
            }
          });
        });
      } else {
        propDiv.innerHTML = propDiv.querySelector('.codelesslove-inspector-header').outerHTML + '<section class="codelesslove-inspector-body"><em>Element not found.</em></section>';
        attachInspectorCloseHandler(propDiv);
      }
    }
  });

  insertInspectorButton();
})(); //👈👈 don't delete this, and don't put anything outside of this!!








