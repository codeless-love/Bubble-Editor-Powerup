"use strict";

const getSortableScript = async () => {
  console.log("getSortableScript running");

  const url = chrome.runtime.getURL("utils/Sortable.min.js");
  console.log("getURL", url);

  await import(url);
  console.log("importing");
  return window.Sortable;
};

console.log("running script on page");
const version = appquery.get_editor_link();
console.log("editor link: " + version);

// const observer = new MutationObserver((mutations) => {
//   mutations.forEach((mutation) => {
//     if (mutation.type === "childList") {
//       mutation.addedNodes.forEach((node) => {
//         if (
//           node.nodeType === Node.ELEMENT_NODE &&
//           node.classList.contains("fields-wrapper")
//         ) {
//           if (node.querySelector(".field-definition-row")) {
//             node
//               .querySelectorAll(".field-definition-row")
//               .forEach((childDiv) => {
//                 const inputElement = childDiv.querySelector("input");
//                 const inputClass = inputElement
//                   ? Array.from(inputElement.classList).find(
//                       (cls) =>
//                         cls.startsWith("fields.") && cls.endsWith(".name")
//                     )
//                   : null;
//                 if (inputClass) {
//                   const modifiedInputClass = inputClass
//                     .replace(/^fields\./, "")
//                     .replace(/\.name$/, "");
//                   childDiv.setAttribute("data-id", modifiedInputClass);
//                 }
//               });

//             let sortable = new Sortable(node, {
//               animation: 150,
//               ghostClass: "sortable-ghost",
//               dragClass: "sortable-drag",
//               dataIdAttr: "data-id",
//               onEnd: () => {
//                 let order = sortable.toArray();
//                 console.log("order", order);
//               },
//             });
//           }
//         }
//       });
//     }
//   });
// });

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  console.log("callback observer ", observer);
  console.log("mutationList", mutationList);
  if (mutationList.length !== 2) {
    console.log("mutationList is not 2", mutationList);
  }
  // for (const mutation of mutationList) {
  //   if (mutation.type === 'childList') {
  //     console.log('A child node has been added or removed.');
  //   } else if (mutation.type === 'attributes') {
  //     console.log(`The ${mutation.attributeName} attribute was modified.`);
  //   }
  // }
};

const colorWrapperObserver = new MutationObserver(callback);

let shouldReRun = true;
let childNodeCount = 0;
async function handleTokenColors() {
  if (shouldReRun === false) return;
  const colorWrapper = document.querySelector(".tokens-editor-wrapper.colors");
  if (colorWrapper) {
    let colorRows = document.querySelectorAll(".token-wrapper");
    childNodeCount = colorRows.length;
    let customColorRows = [];
    colorRows.forEach((el) => {
      if (el.querySelector(".token-name-and-edit")) {
        customColorRows.push(el);
      }
    });

    const newDiv = document.createElement("div");
    newDiv.classList.add("custom-color-rows-container");
    customColorRows.forEach((row) => {
      newDiv.append(row);
    });

    colorWrapper.append(newDiv);
    const Sortable = await getSortableScript();
    let colorsSortable = new window.Sortable(newDiv, {
      animation: 150,
      ghostClass: "sortable-ghost",
      dragClass: "sortable-drag",
      dataIdAttr: "data-id",
      onEnd: () => {
        let order = colorsSortable.toArray();
        console.log("order", order);
      },
    });
    console.log("colorsSortable", colorsSortable);
    shouldReRun = false;
    colorWrapperObserver.observe(colorWrapper, {
      childList: true,
      subtree: true,
    });
    console.log("observer", colorWrapperObserver);
  }
}

const colorTokens = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList" || mutation.type === "subtree") {
      handleTokenColors();
    }
  });
});

// observer.observe(document.body, { childList: true, subtree: true });
colorTokens.observe(document.body, { childList: true, subtree: true });
