console.log("❤️ Enter Debug Feature Loaded in Popup");
// (function() {
//     let thisScriptKey = "runtime_enter_debug";
//     if (thisScriptKey == "loaded") {
//         console.warn("❤️"+thisScriptKey + " tried to load, but it's value is already.");
//         return;
//     }
//     thisScriptKey = "loaded";
 
    // This script runs in the extension's popup.html page.
    // It handles creating and inserting the "debugModePopup" button,
    // and then adds the event listener to modify the URL of the current active tab.

    // Get the main container where the button will be inserted.
    let approvedMain = document.getElementById('Approved');

    if (!approvedMain) {
        console.error("Approved main not found");
    } else {
        // Create the HTML for the button as a string.
        const buttonHtml = `
            <button 
            id="debugModePopup" 
            class="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-full hover:bg-purple-700 transition duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
            Toggle Debug Mode
            </button>
        `;

        // Append the button HTML into the designated container.
        approvedMain.insertAdjacentHTML('beforeend',buttonHtml);

        // Now that the button exists in the DOM, get a reference to it.
        const debugButton = document.getElementById('debugModePopup');

        // Add the click event listener to the newly created button.
        debugButton.addEventListener('click', function() {
            // Use the chrome.tabs API to get information about the active tab
            // in the current browser window.
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            // The query returns an array of tabs, so we get the first one.
            const activeTab = tabs[0];
            const currentUrl = activeTab.url;

            // Check if the URL is valid and not an internal browser page.
            if (currentUrl && currentUrl.startsWith('http')) {
                let newUrl = '';

                // Check if the URL already contains a query string.
                if (currentUrl.includes('?')) {
                // If it has a query string, append the new parameter with an ampersand.
                newUrl = currentUrl + '&debug_mode=true';
                } else {
                // If it doesn't have a query string, append the new parameter with a question mark.
                newUrl = currentUrl + '?debug_mode=true';
                }

                // Use the chrome.tabs.update method to change the URL of the active tab.
                chrome.tabs.update(activeTab.id, { url: newUrl });

                // Close the popup after updating the tab
                window.close();
            } else {
                console.error("The active tab's URL is not a valid HTTP/HTTPS page.");
            }
            });
        });
    }
//})();