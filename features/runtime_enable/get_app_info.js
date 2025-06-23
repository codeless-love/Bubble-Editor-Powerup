(function () {
  let result = {status: (window.appquery || window.app) ? "ok" : "error"};
  if (window.appquery) {
    result.domain = window.appquery?.()?.domain();
    result.app_id = window.appquery?.()?.json?._appname;
    //result.element_definitions = window?.appquery().app()?.json?.raw()?.element_definitions;
  };
  if (window.app) {
  }
  window.postMessage({
    source: "main-world-script",
    action: "appDomainResult",
    payload: result
  }, "*");

  window.addEventListener('message', (event) => {
    if (
      event.source === window &&
      event.data &&
      event.data.action === 'getElementInfo'
    ) {
      const elementId = event.data.payload?.elementId;
      let info = {};
      try {
        const pathArray = app._index.id_to_path[elementId].replace("%ed", "element_definitions").replaceAll("%el", "elements").replaceAll("%p3", "pages").split('.');
        let bubbleElement = appquery.app().json;
        let closestRUAncestorName = null;
        let closestRUAncestorID = null;
        let closestRUAncestorChain = [];
        for (const key of pathArray) {
          console.log(key);
          bubbleElement = bubbleElement.child(key);
          if(bubbleElement?._smart_cache?.element?._type && bubbleElement?._smart_cache?.element?._type === "CustomDefinition") {
            const raw = bubbleElement._smart_cache.element.raw();
            closestRUAncestorName = raw.name;
            closestRUAncestorID = raw.id;
            closestRUAncestorChain.push(closestRUAncestorName)
            console.log("RU: ", closestRUAncestorName, closestRUAncestorID);
          }
        }
        console.log("Finished building element. Exists? ", bubbleElement.exists());
        console.log("Final RU: ", closestRUAncestorName, closestRUAncestorID);
        if(bubbleElement.exists()){
          let parent = bubbleElement._parent._parent.raw();

          info = {
            status: "success",
            element_id: elementId,
            element_name: bubbleElement.__name,
            path_condensed: app._index.id_to_path[elementId],
            path_array: pathArray,
            element: parent.elements[bubbleElement.__name],
            siblings: parent.elements,
            parent: parent,
            ru_name: closestRUAncestorName,
            ru_id: closestRUAncestorID,
            ru_chain: closestRUAncestorChain
          };
        } else {
          info = {
            status: "error",
            error: "Failed to get element.",
            element_id: elementId,
            path_condensed: app._index.id_to_path[elementId],
            path_array: pathArray
          }
        }
        if (window.appquery) {
          info.domain = window.appquery?.()?.domain();
          info.app_id = window.appquery?.()?.json?._appname;
        }
      } catch (e) {
        console.log(e);
        info = {status: "error", error: e}
      }
      console.log("about to post the message. Info: ", info)
      window.postMessage({
        source: "main-world-script",
        action: "elementInfoResult",
        payload: { info }
      }, "*");
    }
  });
})();
