window.loadedCodelessLoveScripts ||= {};
(function () {
    console.log("❤️" + "Tab Naming");
    let thisScriptKey = "tab_naming";

    /* ------------------------------------------------ */
    /* ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ Don't mess with this  ⬇️ ⬇️ ⬇️ ⬇️ ⬇️ */
    /* ------------------------------------------------ */
    if (window.loadedCodelessLoveScripts[thisScriptKey] == "loaded") {
        console.warn("❤️" + thisScriptKey + " tried to load, but it's value is already " + window.loadedCodelessLoveScripts[thisScriptKey]);
        return;
    }
    window.loadedCodelessLoveScripts[thisScriptKey] = "loaded";
    console.log("❤️" + window.loadedCodelessLoveScripts[thisScriptKey]);
    /* ------------------------------------------------ */
    /* ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ Don't mess with this  ⬆️ ⬆️ ⬆️ ⬆️ ⬆️ */
    /* ------------------------------------------------ */

    // Store the original title
    const originalTitle = document.title;

    // Utility to extract query parameters from the URL
    function getQueryParam(param) {
        const url = new URL(window.location.href);
        return url.searchParams.get(param);
    }

    // Function to update the tab title with the branch name
    function updateTabTitle() {
        const version = getQueryParam("version");

        document.title = `${version} | ${originalTitle}`;
        console.log("❤️" + "Tab title updated with branch name: " + version);
    }

    // Watch for changes in the URL (for SPAs)
    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            updateTabTitle();
        }
    });

    // Start observing changes to the document body
    observer.observe(document.body, { childList: true, subtree: true });

    // Run on initial load
    updateTabTitle();
})();
