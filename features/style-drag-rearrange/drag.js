const initial_order = appquery.get_public_setting("color_tokens_user");
console.log("initial_order", initial_order);

document.dispatchEvent(
  new CustomEvent("initialColorOrder", {
    detail: initial_order,
  })
);

document.addEventListener("colorOrderChanged", (e) => {
  console.log("received event", e.detail);
  console.log("editor link", appquery.get_editor_link());
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("message received", message, sender, sendResponse);
//   if (message.action === "colorOrderChanaged") {
//     console.log("received message", message.newOrder);
//     console.log("editor link", appquery.get_editor_link());
//   }
//   sendResponse({ status: "color setting updated" });
// });
