(function () {
  const app = window.appquery?.();
  let result = {status: "error"};
  if (app) {
    result = {
      status: "ok",
      domain: app?.domain(),
      app_id: app?.json?.raw()?._id,
      element_definitions: app?.app()?.json?.raw()?.element_definitions
    };
    console.log("got app info:", result);
  }
  // Send result back to the extension via window.postMessage
  window.postMessage({
    source: "main-world-script",
    action: "appDomainResult",
    payload: result
  }, "*");
})();
