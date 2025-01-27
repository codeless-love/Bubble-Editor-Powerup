window.loadedCodelessLoveScripts ||= {};
(function() { console.log("❤️"+"Sidebar Link");
let thisScriptKey = "sidebar_link_api_connector";
console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);
if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]); return;} // Exit if the script has already been loaded
window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
console.log("❤️"+window.loadedCodelessLoveScripts[thisScriptKey]);

function waitForElement(selector, callback, timeout = 5000) {
  const startTime = Date.now();
  const observer = new MutationObserver(() => {
    const element = document.querySelector(selector);
    if (element) {
      observer.disconnect(); // Stop observing once the element is found
      callback(element);
    } else if (Date.now() - startTime > timeout) {
      console.error("❤️"+`Element ${selector} not found within ${timeout}ms`);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Function to handle triggering the click on the API Connector element
function handleApiConnectorClick() {
  // Find the element with data-id="apiconnector2"
  const element = document.querySelector('[data-id="apiconnector2"]');

  // Trigger a click on the element if it exists
  if (element) {
    console.log("❤️"+'Triggering click on API Connector element.');
    element.click();

    // Remove the focus class ('up8wd42') from the Plugins button
    const APIButton = document.querySelector('button[data-tab-item="Plugins"]');
    if (APIButton) {
      APIButton.classList.remove('up8wd42');  // Remove highlight from Plugins
    }

    // Find the newly created API Connector button and add the 'up8wd42' class to it
    const apiConnectorButton = document.querySelector('button[data-tab-item="API Connector"]');
    if (apiConnectorButton) {
      apiConnectorButton.classList.add('up8wd42');  // Highlight the API Connector button
    }
  } else {
    console.log("❤️"+'[data-id="apiconnector2"] element not found. Waiting...');
  }
}

// Add an event listener for clicks on other buttons in the menu
function addMenuButtonListeners() {
  // Select all buttons that could be clicked
  const menuButtons = document.querySelectorAll('button[data-tab-item]');

  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove 'up8wd42' from the API Connector button when any other button is clicked
      const apiConnectorButton = document.querySelector('button[data-tab-item="API Connector"]');
      if (apiConnectorButton) {
        apiConnectorButton.classList.remove('up8wd42');  // Remove highlight from API Connector
      }
    });
  });
}

// Function to wait for the [data-id="apiconnector2"] element to load
function waitForApiConnectorElement(callback, timeout = 5000) {
  const startTime = Date.now();

  const observer = new MutationObserver(() => {
    const element = document.querySelector('[data-id="apiconnector2"]');
    if (element) {
      observer.disconnect(); // Stop observing once the element is found
      callback();
    } else if (Date.now() - startTime > timeout) {
      console.error("❤️"+`[data-id="apiconnector2"] not found within ${timeout}ms`);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}


// Wait for the Plugins button to exist and then create the new element
waitForElement('button[data-tab-item="Plugins"]', (APIButton) => {
  console.log("❤️"+"Plugins button found:", APIButton);
  // Check if the API Connector button already exists
  const existingApiConnectorButton = document.querySelector('button[data-tab-item="API Connector"]');
  if (existingApiConnectorButton) {
    console.log("❤️"+"API Connector button already exists. Skipping creation.");
    return;  // Exit the function if the button already exists
  }

  // Create a new <span> element
  const newSpan = document.createElement('span');
  newSpan.className = '_1ox6jxm6';

  // Create heart indicator
  const heart = document.createElement('span');
  heart.innerHTML = `<span style="font-size: 4px;color: red;/* margin-left: 0; */position: absolute;top: 4px;left: 4px;">❤️</span>`

  // Create the new button
  const newButton = document.createElement('button');
  newButton.className = 'up8wd41'; // Use the same class for styling
  newButton.ariaLabel = 'API Connector'; // Accessible label
  newButton.dataset.tabItem = 'API Connector';

  // Add inner content, including the custom SVG for "API"
  newButton.innerHTML = `
    <span class="up8wd45">
      <span class="py18712 py1871m">
        <svg viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" class="py1871p">
            <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="14" fill="currentColor" font-family="Arial, sans-serif" font-weight="bold">API</text>
        </svg>
      </span>
    </span>
  `;

  // Append the heart and button to the new span
  newSpan.append(heart, newButton);

  // Insert the new span element after the "Plugins" button's parent
  APIButton.parentElement.parentElement.insertBefore(newSpan, APIButton.parentElement.nextSibling);
  const buttonRect = APIButton.getBoundingClientRect();

  // Create a new element for the hover tooltip
  const hoverTip = document.createElement('div');
  hoverTip.style.display = "none";
  hoverTip.innerHTML = `
    <div
      id="APIConnectorHoverTip"
      style="top: calc(${buttonRect.top}px + ${buttonRect.height + 10}px); left: calc(36px + var(--b-spacing-xs)); z-index: 100000001; position: absolute;"
    >
      <span
        aria-roledescription="tooltip"
        style="width: max-content; border-radius:4px;"
        class="_10x6jxm1 _10x6jxm2 _10x6jxm5 _1lkv1fw9 _1ox6jxm1 _1ox6jxm2 _1ox6jxm5 _1lkv1fw9"
      >❤️ API Connector</span>
    </div>`;
  document.body.appendChild(hoverTip);

  // Add event listener for hover on the new menu button
  newButton.addEventListener('mouseenter', () => {
    hoverTip.style.display = 'block';  // Show the tooltip on hover
  });

  newButton.addEventListener('mouseleave', () => {
    hoverTip.style.display = 'none';  // Hide the tooltip when the hover ends
  });

  // Go to API Connector when it's clicked
  // -------------------------------------
  // Preserve the following parameters with whatever they currently have:
  //  * id
  //  * name
  //  * version
  //
  // Update or add the following parameters to match this
  //  * tab=Plugins
  //  * type=custom
  //
  // Remove all other parameters.
  //
  newSpan.addEventListener('click', () => {
    const currentParams = new URLSearchParams(window.location.search);

    // Preserve the 'id' and 'name' parameters
    const preservedParams = {};
    if (currentParams.has('id')) {
      preservedParams.id = currentParams.get('id');
    }
    if (currentParams.has('name')) {
      preservedParams.name = currentParams.get('name');
    }
    if (currentParams.has('version')) {
      preservedParams.version = currentParams.get('version');
    }

    // Update or add the specified parameters
    const updatedParams = {
      ...preservedParams, // Include preserved parameters
      tab: 'Plugins',
      type: 'custom'
    };

    // Build the new URLSearchParams with only the required parameters
    const newParams = new URLSearchParams(updatedParams);

    // Construct the new URL and update the history
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    history.pushState(null, '', newUrl); // Update the URL without reloading
    // Trigger a popstate event so Bubble actually sees this happens
    window.dispatchEvent(new PopStateEvent('popstate'));
    console.log("❤️"+"Updated URL:", newUrl);

    // Wait for the API Connector element to load and then handle the click
    waitForApiConnectorElement(handleApiConnectorClick);

    // Add listeners for all menu buttons
    addMenuButtonListeners();
  });
});
})();
