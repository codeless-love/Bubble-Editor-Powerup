function setInitialOrder() {
  const initial_order = appquery.get_public_setting("color_tokens_user");
  document.dispatchEvent(
    new CustomEvent("initialColorOrder", {
      detail: initial_order,
    }),
  );
}

document.addEventListener("colorOrderChanged", (e) => {
  appquery.set_setting(!0, "color_tokens_user", e.detail);
});

document.addEventListener("getInitialColors", () => {
  console.log("event triggered getInitialColors");
  setInitialOrder();
});
