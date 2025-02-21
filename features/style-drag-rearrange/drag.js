function setInitialOrder() {
  const initial_order = appquery.get_public_setting("color_tokens_user");
  document.dispatchEvent(
    new CustomEvent("initialColorOrder", {
      detail: initial_order,
    })
  );
}
setInitialOrder();

document.addEventListener("colorOrderChanged", (e) => {
  console.log("payload", e);
  appquery.set_setting(!0, "color_tokens_user", e.detail);
  setInitialOrder();
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("message received", message, sender, sendResponse);
//   if (message.action === "colorOrderChanaged") {
//     console.log("received message", message.newOrder);
//     console.log("editor link", appquery.get_editor_link());
//   }
//   sendResponse({ status: "color setting updated" });
// });
