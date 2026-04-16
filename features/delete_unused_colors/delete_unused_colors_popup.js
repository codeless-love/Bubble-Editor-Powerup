(function () {
  console.log("❤️ Delete unused colors — popup module loaded");

  // ── Feature container ─────────────────────────────────────────────────

  const featureDiv = document
    .getElementById("delete_unused_colors")
    ?.closest(".feature");
  if (!featureDiv) {
    console.error(
      "❤️ Delete unused colors: could not find feature container in popup.",
    );
    return;
  }

  // ── HTML Templates ────────────────────────────────────────────────────

  const toolHtml = `
    <div class="tool-section delete-unused-colors-tool">
      <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 1em;">
        First, preload your application using <strong>Optimize Application</strong> in Bubble's Settings. Then click Scan to detect and delete unused color variables.
      </p>
      <div id="duc-scan-loader" class="duc-scan-loader" hidden>
        <span class="duc-scan-loader-spinner"></span>
        <span>Scanning colors…</span>
      </div>
      <button type="button" id="duc-scan-app-button" class="duc-scan-btn">
        Scan app
      </button>
      <div id="duc-inline-message" class="duc-inline-message" hidden></div>
    </div>
  `;
  featureDiv.insertAdjacentHTML("beforeend", toolHtml);

  const modalHtml = `
    <div id="duc-app-raw-modal" hidden>
      <div class="duc-app-raw-dialog" role="dialog" aria-labelledby="duc-app-raw-title" aria-modal="true">
        <div id="duc-confirm-overlay" class="duc-confirm-overlay" hidden aria-hidden="true">
          <div class="duc-confirm-dialog" role="alertdialog" aria-labelledby="duc-confirm-title" aria-describedby="duc-confirm-message">
            <h3 id="duc-confirm-title" class="duc-confirm-title">Remove from variables?</h3>
            <p id="duc-confirm-message" class="duc-confirm-message"></p>
            <div class="duc-confirm-actions">
              <button type="button" id="duc-confirm-cancel" class="button-secondary">Cancel</button>
              <button type="button" id="duc-confirm-ok" class="duc-apply-btn">Remove</button>
            </div>
          </div>
        </div>
        <div class="duc-dialog-header">
          <h2 id="duc-app-raw-title">Color Variables</h2>
          <button type="button" class="button-secondary" id="duc-app-raw-close" aria-label="Close">Close</button>
        </div>
        <div class="duc-dialog-body">
          <div id="duc-modal-error" class="duc-modal-error" hidden></div>
          <div id="duc-modal-report" hidden>
            <div id="duc-unused-section" class="duc-unused-section" hidden>
              <h3 id="duc-unused-heading" class="duc-unused-heading">Unused colors</h3>
              <div id="duc-unused-select-all-wrap" class="duc-unused-select-all-wrap" hidden>
                <input type="checkbox" id="duc-unused-select-all" checked />
                <label for="duc-unused-select-all">Select / unselect all</label>
              </div>
              <div id="duc-unused-list" class="duc-unused-list"></div>
            </div>
          </div>
        </div>
        <div class="duc-dialog-footer duc-dialog-footer-actions">
          <button type="button" id="duc-apply-mark-deleted" class="duc-apply-btn" hidden>
            Delete selected colors
          </button>
          <button type="button" id="duc-app-raw-close-footer" class="button-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  // ── DOM References ────────────────────────────────────────────────────

  const scanBtn = document.getElementById("duc-scan-app-button");
  const loader = document.getElementById("duc-scan-loader");
  const inlineMessageEl = document.getElementById("duc-inline-message");

  const modal = document.getElementById("duc-app-raw-modal");
  const modalError = document.getElementById("duc-modal-error");
  const modalReport = document.getElementById("duc-modal-report");
  const unusedHeading = document.getElementById("duc-unused-heading");

  const unusedSection = document.getElementById("duc-unused-section");
  const unusedSelectAllWrap = document.getElementById(
    "duc-unused-select-all-wrap",
  );
  const unusedSelectAll = document.getElementById("duc-unused-select-all");
  const unusedList = document.getElementById("duc-unused-list");

  const applyBtn = document.getElementById("duc-apply-mark-deleted");
  const closeBtn = document.getElementById("duc-app-raw-close");
  const closeFooter = document.getElementById("duc-app-raw-close-footer");

  const confirmOverlay = document.getElementById("duc-confirm-overlay");
  const confirmMessageEl = document.getElementById("duc-confirm-message");
  const confirmCancelBtn = document.getElementById("duc-confirm-cancel");
  const confirmOkBtn = document.getElementById("duc-confirm-ok");

  // ── State ─────────────────────────────────────────────────────────────

  let pendingDelete = null;
  let lastAppRawForApply = null;
  let inlineMessageTimer = null;

  // ── Data helpers ──────────────────────────────────────────────────────

  function getUserColorVariables(appRaw) {
    const colorTokensUser =
      appRaw?.raw?.settings?.client_safe?.color_tokens_user ??
      appRaw?.settings?.client_safe?.color_tokens_user;
    if (!colorTokensUser || typeof colorTokensUser !== "object") return null;
    const defaultTokens = colorTokensUser.default;
    return defaultTokens && typeof defaultTokens === "object"
      ? defaultTokens
      : null;
  }

  function buildAppRawWithoutUserColors(appRaw) {
    try {
      const clone = JSON.parse(JSON.stringify(appRaw));
      if (clone.raw?.settings?.client_safe) {
        delete clone.raw.settings.client_safe.color_tokens_user;
      }
      if (clone.settings?.client_safe) {
        delete clone.settings.client_safe.color_tokens_user;
      }
      return JSON.stringify(clone);
    } catch {
      return JSON.stringify(appRaw);
    }
  }

  function analyzeColorVariablesUsage(appRaw) {
    const defaultTokens = getUserColorVariables(appRaw);
    if (!defaultTokens) {
      return {
        error: "color_tokens_user.default not found in app raw.",
        unused: [],
        used: [],
      };
    }

    const appWithoutTokens = buildAppRawWithoutUserColors(appRaw);
    const unused = [];
    const used = [];

    for (const id of Object.keys(defaultTokens)) {
      const token = defaultTokens[id];
      if (token?.deleted) continue;
      const entry = { id, name: token?.name != null ? token.name : "" };
      if (appWithoutTokens.includes(`--color_${id}_`)) {
        used.push(entry);
      } else {
        unused.push(entry);
      }
    }

    return { unused, used };
  }

  function buildColorsVariablesSoftDeleted(appRawSnapshot, idsToDelete) {
    const defaultTokens = getUserColorVariables(appRawSnapshot);
    if (!defaultTokens) return null;

    const updated = JSON.parse(JSON.stringify(defaultTokens));
    for (const id of idsToDelete) {
      if (updated[id]) {
        updated[id].deleted = true;
      }
    }
    return updated;
  }

  // ── MAIN-world functions ──────────────────────────────────────────────
  // Injected into the Bubble editor tab via chrome.scripting.executeScript.
  // They MUST be fully self-contained (no closure references).

  function checkAppPreloaded() {
    return window.appquery().app().json._ready_key.is_turned() === true;
  }

  function fetchAppRawInPage() {
    var raw = window.appquery().app().json.raw();
    if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("App raw is not a JSON object");
    }
    return raw;
  }

  async function runWriteColorVariablesInPage(updatedDefault) {
    function getAppInfo() {
      var params = new URLSearchParams(window.location.search);
      return {
        appname: params.get("id"),
        app_version: params.get("version") || "test",
      };
    }

    try {
      if (!window.Lib || typeof window.Lib !== "function") {
        return { ok: false, error: "Lib() not available" };
      }

      var info = getAppInfo();
      if (!info.appname) {
        return { ok: false, error: "Missing app id in URL" };
      }

      var sessionId = Date.now() + "x" + Math.floor(Math.random() * 1000000000);

      var payload = {
        v: 1,
        appname: info.appname,
        app_version: info.app_version,
        changes: [
          {
            body: { "%d1": updatedDefault },
            path_array: ["settings", "client_safe", "color_tokens_user"],
            intent: { name: "ChangeAppSetting", id: 1 },
            version_control_api_version: 7,
            changelog_data: [
              {
                operation: "changed",
                before_value: null,
                after_value: null,
                display_name: "User color tokens",
                type: "Setting",
                root: null,
                change_path: "settings.client_safe.color_tokens_user.",
                inner_nodes_info: [
                  {
                    change_path: "settings.client_safe.color_tokens_user.",
                    type: "Setting",
                    display_name: "User color tokens",
                  },
                ],
                inner_node_count: 1,
              },
            ],
            session_id: sessionId,
          },
          {
            type: "id_counter",
            value: 10006263, // This might need to be dynamic, but using a static value for now
          },
        ],
      };

      return await new Promise(function (resolve) {
        window
          .Lib()
          .location.post(
            "server://appeditor/write",
            payload,
            function (err, res) {
              if (err) {
                resolve({
                  ok: false,
                  error: typeof err === "string" ? err : String(err),
                });
              } else {
                resolve({ ok: true, result: res });
              }
            },
          );
      });
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────

  async function scanApp() {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (
      !activeTab?.id ||
      !activeTab.url ||
      !activeTab.url.includes("bubble.") ||
      !activeTab.url.includes("/page")
    ) {
      showToolMessage(
        "Please open a Bubble editor page (/page) first.",
        "error",
      );
      return;
    }

    scanBtn.disabled = true;
    hideToolMessage();

    try {
      const preloadCheck = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        world: "MAIN",
        func: checkAppPreloaded,
      });
      if (!preloadCheck?.[0]?.result) {
        showToolMessage(
          'App not preloaded. Use "Optimize Application" in Bubble Settings first.',
          "error",
        );
        return;
      }

      loader.hidden = false;
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        world: "MAIN",
        func: fetchAppRawInPage,
      });
      openModal(results?.[0]?.result ?? { __error: "No result from page" });
    } catch (error) {
      console.error("❤️ Delete unused colors scan failed:", error);
      showToolMessage("Scan failed. Try again later.", "error");
    } finally {
      loader.hidden = true;
      scanBtn.disabled = false;
    }
  }

  async function runDeleteWrite(updatedDefault, ids) {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.id) {
      hideConfirmOverlay();
      showToolMessage("No active editor tab.", "error");
      return;
    }

    applyBtn.disabled = true;
    confirmOkBtn.disabled = true;
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        world: "MAIN",
        func: runWriteColorVariablesInPage,
        args: [updatedDefault],
      });
      const res = results?.[0]?.result;
      hideConfirmOverlay();

      if (res?.ok) {
        lastAppRawForApply = null;
        applyBtn.hidden = true;
        closeModal();
        const n = ids.length;
        showToolMessage(
          `Done. ${n} color${n > 1 ? "s" : ""} removed from the variables.`,
          "success",
        );
      } else {
        console.error("❤️ Delete unused colors write failed:", res?.error);
        closeModal();
        showToolMessage("Could not save changes. Try again later.", "error");
      }
    } catch (err) {
      console.error("❤️ Delete unused colors write failed:", err);
      hideConfirmOverlay();
      closeModal();
      showToolMessage("Could not save changes. Try again later.", "error");
    } finally {
      applyBtn.disabled = false;
      confirmOkBtn.disabled = false;
      updateApplyButtonVisibility();
    }
  }

  function handleApplyClick() {
    if (!lastAppRawForApply) {
      showToolMessage("Run a scan first.", "error");
      return;
    }
    const ids = Array.from(
      unusedList.querySelectorAll(".duc-unused-item-cb:checked"),
    )
      .map((c) => c.dataset.tokenId)
      .filter(Boolean);

    if (ids.length === 0) {
      showToolMessage("Select at least one color to remove.", "error");
      return;
    }

    const updatedDefault = buildColorsVariablesSoftDeleted(
      lastAppRawForApply,
      ids,
    );
    if (!updatedDefault) {
      console.error(
        "❤️ Delete unused colors: could not build write payload from last scan",
      );
      showToolMessage("Could not prepare the changes.", "error");
      return;
    }

    const label = ids.length === 1 ? "1 color" : `${ids.length} colors`;
    pendingDelete = { updatedDefault, ids };
    showConfirmOverlay(`Delete ${label} from the variables?`);
  }

  // ── Event listeners ───────────────────────────────────────────────────

  scanBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    scanApp();
  });

  closeBtn.addEventListener("click", closeModal);
  closeFooter.addEventListener("click", closeModal);
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) closeModal();
  });

  unusedSelectAll.addEventListener("change", () => {
    const on = unusedSelectAll.checked;
    unusedList
      .querySelectorAll(".duc-unused-item-cb")
      .forEach((c) => (c.checked = on));
    unusedSelectAll.indeterminate = false;
    updateApplyButtonVisibility();
  });

  applyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleApplyClick();
  });

  confirmCancelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideConfirmOverlay();
  });

  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) hideConfirmOverlay();
  });

  confirmOverlay
    .querySelector(".duc-confirm-dialog")
    ?.addEventListener("click", (e) => e.stopPropagation());

  confirmOkBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!pendingDelete) return;
    const { updatedDefault, ids } = pendingDelete;
    runDeleteWrite(updatedDefault, ids);
  });

  // ── Modal UI ──────────────────────────────────────────────────────────

  function updateApplyButtonVisibility() {
    if (!lastAppRawForApply) {
      applyBtn.hidden = true;
      applyBtn.disabled = true;
      return;
    }
    const hasUnused =
      unusedList.querySelectorAll(".duc-unused-item-cb").length > 0;
    const anyChecked = !!unusedList.querySelector(
      ".duc-unused-item-cb:checked",
    );
    applyBtn.hidden = !hasUnused;
    applyBtn.disabled = !anyChecked;
  }

  function updateUnusedSelectAllState() {
    const cbs = unusedList.querySelectorAll(".duc-unused-item-cb");
    if (cbs.length === 0) return;
    let checked = 0;
    cbs.forEach((c) => {
      if (c.checked) checked++;
    });
    unusedSelectAll.checked = checked === cbs.length;
    unusedSelectAll.indeterminate = checked > 0 && checked < cbs.length;
  }

  function renderUnusedCheckboxes(unused) {
    unusedList.innerHTML = "";
    unusedSection.hidden = false;

    if (unused.length === 0) {
      unusedSelectAllWrap.hidden = true;
      const empty = document.createElement("p");
      empty.className = "duc-unused-empty";
      empty.textContent = "No unused colors.";
      unusedList.appendChild(empty);
      updateApplyButtonVisibility();
      return;
    }

    unusedSelectAllWrap.hidden = false;
    unusedSelectAll.checked = true;
    unusedSelectAll.indeterminate = false;

    unused.forEach((token, index) => {
      const row = document.createElement("div");
      row.className = "duc-unused-row";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "duc-unused-item-cb";
      cb.id = "duc-unused-item-" + index;
      cb.dataset.tokenId = token.id;
      cb.checked = true;
      cb.addEventListener("change", () => {
        updateUnusedSelectAllState();
        updateApplyButtonVisibility();
      });

      const label = document.createElement("label");
      label.htmlFor = cb.id;
      label.textContent = token.name || token.id || "(unnamed)";

      row.appendChild(cb);
      row.appendChild(label);
      unusedList.appendChild(row);
    });

    updateApplyButtonVisibility();
  }

  // ── Confirm overlay ───────────────────────────────────────────────────

  function hideConfirmOverlay() {
    confirmOverlay.hidden = true;
    confirmOverlay.setAttribute("aria-hidden", "true");
    pendingDelete = null;
    confirmOkBtn.disabled = false;
  }

  function showConfirmOverlay(messageText) {
    confirmMessageEl.textContent = messageText;
    confirmOverlay.hidden = false;
    confirmOverlay.setAttribute("aria-hidden", "false");
    confirmOkBtn.focus();
  }

  // ── Modal open / close ────────────────────────────────────────────────

  function resetModal() {
    hideConfirmOverlay();
    modalError.hidden = true;
    modalError.textContent = "";
    modalReport.hidden = true;
    unusedHeading.textContent = "Unused colors";
    unusedSection.hidden = true;
    unusedList.innerHTML = "";
    unusedSelectAllWrap.hidden = true;
    lastAppRawForApply = null;
    applyBtn.hidden = true;
  }

  function openModal(data) {
    resetModal();
    document.body.style.overflow = "hidden";

    if (!data) {
      console.error("❤️ Delete unused colors: openModal received no data");
      modalError.textContent = "Nothing to show.";
      modalError.hidden = false;
      modal.hidden = false;
      return;
    }
    if (data.__error) {
      console.error("❤️ Delete unused colors: load failed", data.__error);
      modalError.textContent =
        "Could not load app data. Run Optimize Application, then try Scan again.";
      modalError.hidden = false;
      modal.hidden = false;
      return;
    }

    const appRaw = data;
    const report = analyzeColorVariablesUsage(appRaw);

    if (report.error) {
      console.error("❤️ Delete unused colors: analyze failed", report.error);
      modalError.textContent =
        "Could not analyze color variables in this app. Try again later.";
      modalError.hidden = false;
      modal.hidden = false;
      return;
    }

    unusedHeading.textContent = `Unused colors (${report.unused.length})`;

    try {
      lastAppRawForApply = JSON.parse(JSON.stringify(appRaw));
    } catch (e) {
      console.error("❤️ Delete unused colors: could not clone app data", e);
      lastAppRawForApply = null;
    }

    renderUnusedCheckboxes(report.unused);

    modalReport.hidden = false;
    modal.hidden = false;
  }

  function closeModal() {
    hideConfirmOverlay();
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  // ── Utility: inline message ───────────────────────────────────────────

  function showToolMessage(text, kind) {
    if (inlineMessageTimer) {
      clearTimeout(inlineMessageTimer);
      inlineMessageTimer = null;
    }
    inlineMessageEl.textContent = text;
    inlineMessageEl.classList.remove(
      "duc-inline-message--success",
      "duc-inline-message--error",
    );
    if (kind === "success") {
      inlineMessageEl.classList.add("duc-inline-message--success");
    } else if (kind === "error") {
      inlineMessageEl.classList.add("duc-inline-message--error");
    }
    inlineMessageEl.hidden = false;
    if (kind === "success") {
      inlineMessageTimer = setTimeout(() => {
        inlineMessageEl.hidden = true;
        inlineMessageEl.textContent = "";
        inlineMessageTimer = null;
      }, 8000);
    }
  }

  function hideToolMessage() {
    if (inlineMessageTimer) {
      clearTimeout(inlineMessageTimer);
      inlineMessageTimer = null;
    }
    inlineMessageEl.hidden = true;
    inlineMessageEl.textContent = "";
    inlineMessageEl.classList.remove(
      "duc-inline-message--success",
      "duc-inline-message--error",
    );
  }
})();
