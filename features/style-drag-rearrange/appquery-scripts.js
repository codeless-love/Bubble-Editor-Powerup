/**
 * Utility function that waits for a DOM element matching the given selector to appear.
 * @param {string} selector - CSS selector to look for
 * @param {Function} callback - Function to call when the element is found
 */
function waitForElement(selector, callback) {
  const observer = new MutationObserver((mutationsList, observer) => {
    if (document.querySelector(selector)) {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  if (document.querySelector(selector)) {
    // If the element already exists, disconnect the observer and call the callback.
    observer.disconnect();
    callback();
  }
}
/**
 * Retrieves the initial color order from appquery and dispatches the 'initialColorOrder' event.
 */
function setInitialOrder() {
  const color_tokens_user = appquery.get_public_setting("color_tokens_user");
  document.dispatchEvent(
    new CustomEvent("initialColorOrder", {
      detail: { color_tokens_user: color_tokens_user },
    })
  );
}

function setStylesPageListeners() {
  document.addEventListener("set_color_tokens_user", (e) => {
    appquery.set_setting(true, "color_tokens_user", e.detail);
  });

  document.addEventListener("get_color_tokens_user", () => {
    setInitialOrder();
  });
  console.log(
    "listening to events on 'get_color_tokens_user'",
    appquery.get_public_setting("color_tokens_user")
  );
}

waitForElement(".tokens-editor-wrapper.colors", () => {
  setStylesPageListeners();
});
