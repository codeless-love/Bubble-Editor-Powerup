(function() {
  const FEATURE_KEY = "expression_arbitrary_text_display_main_world";
  if (window[FEATURE_KEY] === true) {
    return;
  }
  window[FEATURE_KEY] = true;

  const DISPLAY_PROP = "codelessLove_display";
  const POPOVER_SELECTOR = ".expression-popover.ppe.arbitrary-text-popover";
  const ROW_ATTR = "data-cl-arbitrary-text-display-row";
  const LABEL_ID = "field_codelessLove_display_label";
  const DISPLAY_FIELD_CLASS = "bubble-ui field new-composer full-width";
  const SINGLE_LINE_INPUT_CLASS = "cl-single-line-property-input";
  const SINGLE_LINE_INPUT_CONTROL_CLASS = "cl-single-line-property-input__control";
  const DISPLAY_PREFIX = " 𝐓 ";
  const FALLBACK_TITLE = "Arbitrary text";
  const lib = window.Lib();

  const mountedPopovers = new Map();
  const ownerCache = new Map();
  let processScheduled = false;
  let renderNonce = 0;

  // Bubble always tracks the currently open PPE popover, which gives us the
  // Arbitrary text datasource path we need to hydrate against.
  function getCurrentPopoverPath() {
    return lib?.Popover?.get_last?.()?.path?.() ?? null;
  }

  // Custom token labels are stored as an extra datasource property.
  function getStoredDisplay(node) {
    return node?.json?.child?.("properties")?.child?.(DISPLAY_PROP)?.get?.() ?? null;
  }

  // Empty or whitespace-only values should remove the custom label.
  function normalizeDisplayValue(value) {
    const trimmed = String(value ?? "").trim();
    return trimmed === "" ? null : trimmed;
  }

  // Bubble token labels should show a visual marker without changing storage.
  function formatDisplayLabel(value) {
    return value ? `${DISPLAY_PREFIX}${value}` : null;
  }

  // Cache live SlidableAtom owners so the extra row can mount immediately when
  // the popover opens, instead of waiting on an async owner lookup.
  function cacheOwner(owner) {
    const path = owner?.path;
    if (!path || owner?.node?.type?.() !== "ArbitraryText") {
      return;
    }

    ownerCache.set(path, owner);
  }

  function getCachedOwner(path) {
    if (!path) {
      return null;
    }

    const owner = ownerCache.get(path);
    if (!owner || owner?.node?.type?.() !== "ArbitraryText") {
      ownerCache.delete(path);
      return null;
    }

    return owner;
  }

  // Keep the visible token in sync with Bubble's current datasource display().
  function updateOwnerCanvasText(owner) {
    if (!owner?.canvas?.text || owner?.node?.type?.() !== "ArbitraryText") {
      return;
    }

    const displayValue = owner.node.display?.() ?? FALLBACK_TITLE;
    owner.canvas.text(displayValue);
  }

  // ArbitraryText.display() is the single source of truth for token text.
  function patchArbitraryTextPluginDisplay() {
    const plugin = lib.load_plugin(lib.plugin_prefixes.datasource + "ArbitraryText", true);
    if (!plugin || plugin.__clArbitraryTextDisplayPatched) {
      return;
    }

    const originalDisplay = plugin.display;

    plugin.display = function(staticProperty, datasource) {
      return (
        formatDisplayLabel(staticProperty?.(DISPLAY_PROP)) ??
        originalDisplay.call(this, staticProperty, datasource)
      );
    };

    plugin.__clArbitraryTextDisplayPatched = true;
  }

  // Bubble uses get_display_for_sliding_palette() for the popover heading.
  // We override only ArbitraryText so the title stays stable while token text
  // still comes from the patched datasource display().
  function patchArbitraryTextSlidingPaletteTitle(node) {
    const prototype = Object.getPrototypeOf(node);
    if (!prototype || prototype.__clArbitraryTextSlidingPalettePatched) {
      return;
    }

    const originalGetDisplayForSlidingPalette = prototype.get_display_for_sliding_palette;

    prototype.get_display_for_sliding_palette = function() {
      if (this?._type === "ArbitraryText") {
        return FALLBACK_TITLE;
      }

      return typeof originalGetDisplayForSlidingPalette === "function"
        ? originalGetDisplayForSlidingPalette.call(this)
        : this.display?.();
    };

    prototype.__clArbitraryTextSlidingPalettePatched = true;
  }

  // Every Arbitrary text token is a SlidableAtom. Patching its canvas build is
  // the cleanest place to cache owners and normalize visible labels.
  function patchSlidableAtomBuildSpotCanvas() {
    const SlidableAtom = lib.composer.SlidableAtom;
    if (SlidableAtom.prototype.__clArbitraryTextDisplayPatched) {
      return;
    }

    const originalBuildSpotCanvas = SlidableAtom.prototype.build_spot_canvas;

    SlidableAtom.prototype.build_spot_canvas = function(...args) {
      const result = originalBuildSpotCanvas.apply(this, args);
      patchArbitraryTextSlidingPaletteTitle(this.node);
      cacheOwner(this);
      updateOwnerCanvasText(this);

      return result;
    };

    SlidableAtom.prototype.__clArbitraryTextDisplayPatched = true;
  }

  // The cache is the fast path. Bubble's composer lookup is the fallback when
  // the token was created before this feature loaded.
  function getOwnerForPath(path) {
    const cachedOwner = getCachedOwner(path);
    if (cachedOwner) {
      return Promise.resolve(cachedOwner);
    }

    return new Promise(resolve => {
      if (!path) {
        resolve(null);
        return;
      }

      lib.composer.get_owner(path, owner => {
        cacheOwner(owner);
        resolve(owner ?? null);
      }, true);
    });
  }

  // Popovers are recreated often, so tear down any temporary composer state
  // when their DOM disappears or we remount against a different owner path.
  function cleanupMountedPopover(popover) {
    const mounted = mountedPopovers.get(popover);
    if (!mounted) {
      return;
    }

    mounted.composer?.composerCanvas?.destroy?.();
    if (mounted.composer?.props?.id) {
      lib.composer.clear_owner(mounted.composer.props.id);
    }

    mounted.labelRow?.remove();
    mounted.inputRow?.remove();
    mountedPopovers.delete(popover);
  }

  function cleanupDisconnectedPopovers() {
    for (const [popover] of mountedPopovers) {
      if (!popover.isConnected) {
        cleanupMountedPopover(popover);
      }
    }
  }

  // Bubble already renders the exact row structure we want for "Value", so we
  // clone and retarget it instead of recreating PPE layout from scratch.
  function replaceCaptionText(container, fromText, toText) {
    const captionRoot = container?.querySelector?.("[data-caption-for-prop]");
    if (!captionRoot) {
      return false;
    }

    const walker = document.createTreeWalker(captionRoot, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.textContent?.trim() === fromText) {
        currentNode.textContent = currentNode.textContent.replace(fromText, toText);
        return true;
      }
      currentNode = walker.nextNode();
    }

    return false;
  }

  // Clone the native caption wrapper and retarget it to the custom property.
  function createDisplayLabelRow(valueLabelWrapper) {
    const labelClone = valueLabelWrapper.cloneNode(true);
    labelClone.setAttribute(ROW_ATTR, "label");

    const label = labelClone.querySelector("label");
    if (label) {
      label.id = LABEL_ID;
      label.setAttribute("for", "");
    }

    const captionNode = labelClone.querySelector("[data-caption-for-prop]");
    if (captionNode) {
      captionNode.setAttribute("data-caption-for-prop", DISPLAY_PROP);
    }

    replaceCaptionText(labelClone, "Value", "Display");

    for (const child of Array.from(labelClone.children)) {
      if (child.tagName === "LABEL") {
        continue;
      }
      if (child.getAttribute?.("aria-hidden") === "true") {
        child.remove();
        continue;
      }
      if (child.tagName === "BUTTON" || child.querySelector?.("button")) {
        child.remove();
      }
    }

    return labelClone;
  }

  // Clone the native editor row and swap its body for our Bubble composer.
  function createDisplayInputRow(valueRow, composerCanvas) {
    const rowClone = valueRow.cloneNode(true);
    rowClone.setAttribute(ROW_ATTR, "input");

    const itemWrapper = rowClone.querySelector(".item-wrapper");
    if (!itemWrapper) {
      return null;
    }

    itemWrapper.setAttribute("data-prop-name", DISPLAY_PROP);
    itemWrapper.removeAttribute("data-testid");
    itemWrapper.innerHTML = "";

    const composerElement = composerCanvas?.jquery ? composerCanvas[0] : composerCanvas;
    if (!composerElement) {
      return null;
    }

    composerElement.classList?.add("bubble-ui", "field", "new-composer", "full-width");
    composerElement.classList?.add(SINGLE_LINE_INPUT_CLASS);
    itemWrapper.appendChild(composerElement);
    applySingleLineInputClasses(composerElement);

    return rowClone;
  }

  // Styling lives in the feature stylesheet; JS only tags the real input.
  function applySingleLineInputClasses(composerElement) {
    const input = composerElement?.querySelector?.("input");
    if (!input) {
      return;
    }

    input.classList.add(SINGLE_LINE_INPUT_CONTROL_CLASS);
    input.setAttribute("data-cl-single-line-property-input", "true");
  }

  // Reuse Bubble's existing TextBox composer so the field behaves like a native
  // single-line property editor input while still writing to our custom prop.
  function mountDisplayComposer(owner) {
    const initialValue = getStoredDisplay(owner.node) ?? "";
    const tempOwner = lib.composer.Owner(initialValue);
    const { get_composer: getComposer } = window.safe_require.safe_require("./editor/composer/compatibility/composers");

    const composer = getComposer("TextBox", tempOwner, {
      json: tempOwner.json,
      class: DISPLAY_FIELD_CLASS,
      default_value: "",
      placeholder: "Optional placeholder",
      optional: true,
      do_not_commit_changes: true,
      flushTimeout: "immediate",
      on_change: value => {
        const normalizedValue = normalizeDisplayValue(value);
        owner.node.set_property(DISPLAY_PROP, normalizedValue);
        updateOwnerCanvasText(owner);
      }
    });

    composer.set_value?.(initialValue);
    return composer;
  }

  // Tie the cloned PPE label to Bubble's generated input id for accessibility.
  function wireLabelToComposer(labelRow, composer) {
    const inputId = composer?.props?.id ?? "";
    if (!inputId) {
      return;
    }

    const label = labelRow.querySelector("label");
    if (label) {
      label.setAttribute("for", inputId);
    }
  }

  // Hydrate one popover from the current open Arbitrary text token. Each DOM
  // popover is bound once for its lifetime; when nested popovers open we do
  // not want older popovers to be rebound to the newest `get_last()` path.
  // The nonce guards against stale async owner lookups racing with rerenders.
  async function hydratePopover(popover) {
    if (mountedPopovers.has(popover)) {
      return;
    }

    const ownerPath = getCurrentPopoverPath();
    if (!ownerPath) {
      cleanupMountedPopover(popover);
      return;
    }

    const viewport = popover.querySelector(".pop-viewport");
    if (!viewport) {
      return;
    }

    const valueLabelWrapper = Array.from(viewport.children).find(child => child.querySelector?.("#field_arbitrary_text_label"));
    const valueRow = Array.from(viewport.children).find(child => child.matches?.(".property-editor-row") && child.querySelector?.('.item-wrapper[data-prop-name="arbitrary_text"]'));
    if (!valueLabelWrapper || !valueRow) {
      return;
    }

    const nonce = String(++renderNonce);
    popover.dataset.clArbitraryTextNonce = nonce;

    const owner = await getOwnerForPath(ownerPath);
    if (!popover.isConnected || popover.dataset.clArbitraryTextNonce !== nonce) {
      return;
    }

    if (!owner || owner.node?.type?.() !== "ArbitraryText") {
      return;
    }

    patchArbitraryTextSlidingPaletteTitle(owner.node);
    updateOwnerCanvasText(owner);

    const labelRow = createDisplayLabelRow(valueLabelWrapper);
    const composer = mountDisplayComposer(owner);
    if (!composer) {
      return;
    }

    const inputRow = createDisplayInputRow(valueRow, composer.get_canvas?.() ?? composer.canvas);
    if (!inputRow) {
      cleanupMountedPopover(popover);
      return;
    }

    wireLabelToComposer(labelRow, composer);

    viewport.insertBefore(labelRow, valueLabelWrapper);
    viewport.insertBefore(inputRow, valueLabelWrapper);

    mountedPopovers.set(popover, {
      ownerPath,
      labelRow,
      inputRow,
      composer
    });
  }

  // Apply global patches first, then hydrate any currently mounted popovers.
  function processPopovers() {
    cleanupDisconnectedPopovers();
    patchArbitraryTextPluginDisplay();
    patchSlidableAtomBuildSpotCanvas();
    document.querySelectorAll(POPOVER_SELECTOR).forEach(popover => {
      hydratePopover(popover);
    });
  }

  // Bubble mutates the editor DOM aggressively; coalescing observer work into a
  // microtask keeps the feature responsive without repeated duplicate mounts.
  function scheduleProcessPopovers() {
    if (processScheduled) {
      return;
    }

    processScheduled = true;
    queueMicrotask(() => {
      processScheduled = false;
      processPopovers();
    });
  }

  const observer = new MutationObserver(scheduleProcessPopovers);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  scheduleProcessPopovers();
})();
