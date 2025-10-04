window.loadedCodelessLoveScripts ||= {};
(function() {
  console.log("❤️" + "Styles Drag Rearrange - ISOLATED WORLD script");
  let thisScriptKey = "styles_drag_rearrange";
  /* You can ignore all the stuff on this line, but don't delete! */ console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} /*Exit if already loaded*/ window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

  // Inject main world script to access appquery
  chrome.runtime.sendMessage({
    action: "injectScriptIntoMainWorld",
    jsFile: "features/styles-drag-rearrange/styles-drag-rearrange-main.js"
  });

  let draggedElement = null;
  let saveButton = null;

  // Extract token ID from a token wrapper element
  function getTokenId(wrapper) {
    // Token IDs are stored in class names like "token-cm123"
    // or in data attributes
    const classes = Array.from(wrapper.classList);
    for (const className of classes) {
      // Look for classes that match the token ID pattern (e.g., "token-cmMXY")
      if (className.startsWith('token-') && className.length > 6) {
        return className.substring(6); // Remove "token-" prefix
      }
    }

    // Fallback: check for data-token-id attribute
    if (wrapper.dataset.tokenId) {
      return wrapper.dataset.tokenId;
    }

    // Fallback: try to extract from child elements
    const tokenIdElement = wrapper.querySelector('[data-token-id]');
    if (tokenIdElement) {
      return tokenIdElement.dataset.tokenId;
    }

    console.warn('❤️ Could not find token ID for wrapper:', wrapper);
    return null;
  }

  // Get current order of all token IDs from DOM
  function getCurrentTokenOrder() {
    const wrappers = document.querySelectorAll('.token-wrapper.draggable');
    const tokenOrder = [];

    wrappers.forEach(wrapper => {
      const tokenId = getTokenId(wrapper);
      if (tokenId) {
        tokenOrder.push(tokenId);
      }
    });

    console.log('❤️ Current token order:', tokenOrder);
    return tokenOrder;
  }

  // Save the current order
  function saveOrder() {
    const tokenOrder = getCurrentTokenOrder();

    if (tokenOrder.length === 0) {
      console.error('❤️ No tokens found to save');
      updateSaveButton('error', 'No tokens found');
      return;
    }

    // Update button state
    updateSaveButton('saving');

    // Send message to main world to save
    window.postMessage({
      source: 'isolated-world-script',
      action: 'saveColorTokenOrder',
      payload: {
        tokenOrder: tokenOrder
      }
    }, '*');
  }

  // Update save button state
  function updateSaveButton(state, message) {
    if (!saveButton) return;

    switch (state) {
      case 'saving':
        saveButton.textContent = 'Saving...';
        saveButton.disabled = true;
        saveButton.classList.add('saving');
        break;
      case 'success':
        saveButton.textContent = message || 'Saved!';
        saveButton.classList.remove('saving');
        saveButton.classList.add('success');
        // Hide after 2 seconds
        setTimeout(() => {
          saveButton.classList.remove('show', 'success');
          saveButton.textContent = 'Save Order';
          saveButton.disabled = false;
        }, 2000);
        break;
      case 'error':
        saveButton.textContent = message || 'Error - Try Again';
        saveButton.disabled = false;
        saveButton.classList.remove('saving');
        saveButton.classList.add('error');
        // Reset after 3 seconds
        setTimeout(() => {
          saveButton.textContent = 'Save Order';
          saveButton.classList.remove('error');
        }, 3000);
        break;
      default:
        saveButton.textContent = 'Save Order';
        saveButton.disabled = false;
        saveButton.classList.remove('saving', 'success', 'error');
    }
  }

  // Listen for messages from main world
  window.addEventListener('message', (event) => {
    if (
      event.source === window &&
      event.data &&
      event.data.source === 'main-world-script' &&
      event.data.action === 'saveColorTokenOrderResult'
    ) {
      console.log('❤️ Received save result:', event.data);

      if (event.data.payload.status === 'success') {
        updateSaveButton('success');
      } else {
        const errorMsg = event.data.payload.error || 'Unknown error';
        console.error('❤️ Save failed:', errorMsg);
        updateSaveButton('error', 'Error - Try Again');
      }
    }
  });

  // Create and add save order button
  function createSaveButton() {
    if (saveButton) return saveButton;

    saveButton = document.createElement('button');
    saveButton.id = 'styles-save-order-btn';
    saveButton.textContent = 'Save Order';

    saveButton.addEventListener('click', saveOrder);

    document.body.appendChild(saveButton);
    return saveButton;
  }

  // Show save button
  function showSaveButton() {
    const btn = createSaveButton();
    btn.classList.add('show');
  }

  // Function to make token wrappers draggable
  function makeDraggable() {
    // Find all token-wrapper elements that have a direct child with class token-name-and-edit
    const tokenWrappers = document.querySelectorAll('.token-wrapper');

    tokenWrappers.forEach(wrapper => {
      // Check if it has a direct child with class token-name-and-edit
      const hasTokenNameChild = Array.from(wrapper.children).some(child =>
        child.classList.contains('token-name-and-edit')
      );

      if (!hasTokenNameChild) return;

      // Skip if already processed
      if (wrapper.dataset.draggableEnabled) return;

      // Mark as processed
      wrapper.dataset.draggableEnabled = "true";
      wrapper.classList.add('draggable');
      wrapper.setAttribute('draggable', 'true');

      // Drag start event
      wrapper.addEventListener('dragstart', function(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
      });

      // Drag end event
      wrapper.addEventListener('dragend', function(e) {
        this.classList.remove('dragging');
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over, .drag-over-bottom').forEach(el => {
          el.classList.remove('drag-over', 'drag-over-bottom');
        });
      });

      // Drag over event
      wrapper.addEventListener('dragover', function(e) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';

        if (draggedElement === this) return;

        // Remove previous drag-over classes
        document.querySelectorAll('.drag-over, .drag-over-bottom').forEach(el => {
          el.classList.remove('drag-over', 'drag-over-bottom');
        });

        // Determine if we should insert before or after based on mouse position
        const rect = this.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
          this.classList.add('drag-over');
        } else {
          this.classList.add('drag-over-bottom');
        }

        return false;
      });

      // Drag enter event
      wrapper.addEventListener('dragenter', function(e) {
        if (draggedElement === this) return;
      });

      // Drag leave event
      wrapper.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over', 'drag-over-bottom');
      });

      // Drop event
      wrapper.addEventListener('drop', function(e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        }

        if (draggedElement === this) return false;

        // Determine if we should insert before or after
        const rect = this.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
          // Insert before
          this.parentNode.insertBefore(draggedElement, this);
        } else {
          // Insert after
          this.parentNode.insertBefore(draggedElement, this.nextSibling);
        }

        // Show save button after successful drop
        showSaveButton();

        return false;
      });
    });
  }

  // Initial run
  makeDraggable();

  // Set up a MutationObserver to watch for new token wrappers being added
  const observer = new MutationObserver(function(mutations) {
    makeDraggable();
  });

  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
