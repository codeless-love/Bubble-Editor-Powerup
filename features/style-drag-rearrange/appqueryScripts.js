/**
 * Module to handle the interaction with Bubble's appquery API for color token settings.
 *
 * This script registers event listeners to set and update the initial color order
 * and to persist changes when the order is modified.
 *
 * @module style-drag-rearrange/appqueryScripts
 */

/**
 * Retrieves the initial color order from appquery and dispatches the 'initialColorOrder' event.
 */
function setInitialOrder() {
  const initial_order = appquery.get_public_setting("color_tokens_user");
  document.dispatchEvent(
    new CustomEvent("initialColorOrder", {
      detail: initial_order,
    }),
  );
}

document.addEventListener("colorOrderChanged", (e) => {
  // Update the color token settings in appquery on order change.
  appquery.set_setting(true, "color_tokens_user", e.detail);
});

document.addEventListener("getInitialColors", () => {
  console.log("event triggered getInitialColors");
  setInitialOrder();
});
