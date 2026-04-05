# Delete Unused Colors

Contributed by Thomas Mey (https://www.linkedin.com/in/thomas-mey97/)

Delete Unused Colors scans your Bubble app for color variables that are not referenced anywhere, and lets you soft-delete them in bulk from the Powerup extension popup.

This feature complements Bubble's built-in **Optimize Application**: that step preloads the full app JSON, but it does not identify or remove unused color variables. This tool fills that gap.

## Prerequisites

This feature does **not** trigger a full app load itself. The complete JSON must already be in memory before scanning. Use Bubble's built-in **Optimize Application** (available in Bubble Settings) to preload the app data first.

Why not load the JSON ourselves? Loading the entire app into memory is a heavy operation that can freeze the browser and spike server load on large apps. We deliberately avoid taking responsibility for that: the user should consciously trigger it via Bubble's official tool, rather than having the extension silently do it in the background when they click "Scan".

The extension checks `appquery().app().json._ready_key.is_turned()` to verify the JSON is already fully loaded before allowing a scan.

## How It Works

- Open your Bubble editor.
- Run **Optimize Application** from Bubble Settings so the full app JSON is loaded in memory.
- Click the Powerup extension icon in your browser.
- In the popup, scroll down to "Delete Unused Colors" and click **Scan app**.
- The extension reads User Colors Variables, skips tokens already marked as `deleted`, and checks whether each remaining token's variable appears anywhere else in the app JSON.
- Select the unused colors you want to remove and confirm.
- Selected tokens are **soft-deleted** (`deleted: true`), which means they can still be restored from the Bubble editor.

## Why Soft Delete

Soft delete is the safer approach: tokens are flagged as deleted but remain in the JSON, so Bubble can restore them if needed, or if the colors was flagged as "unused" by error. This is already useful for cleaning up unused styles and keeping the variables manageable.

A hard delete (removing tokens entirely from the JSON) could be implemented later for better app optimization, but soft delete covers the common cleanup use case without risk.

[⬆️ Back to root directory](../../)
