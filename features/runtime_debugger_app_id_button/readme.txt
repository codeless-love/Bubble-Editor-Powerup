# Debugger App ID Button Feature

## SUMMARY

This feature adds a button to the Bubble app's web view debugger bar (not the editor) when the URL contains `debug_mode=true`. When clicked, the button will alert the app's ID using `window.appquery().json.raw()._id`.

## HOW IT WORKS

- The feature only activates on pages where the URL contains `debug_mode=true`.
- It waits for `.debugger-canvas .top-bar` to appear, then inserts a button at the end.
- Clicking the button will show an alert with the app's ID.
- The button is only added once and is styled with a heart emoji for easy identification.

## HOW TO MODIFY

- To change the alert to run a different script, edit the `btn.onclick` handler in `debugger_app_id_button.js`.
- To change the style, edit `debugger_app_id_button.css`.

## CONVENTIONS

- The feature uses the `window.loadedCodelessLoveScripts` system to prevent duplicate loads.
- The CSS uses the `❤️ codelesslove,` selector prefix for easy debugging.
- The feature is only active in the app's web view, not the editor.

## FILES
- `debugger_app_id_button.js`: Main feature logic
- `debugger_app_id_button.css`: Button styling
- `readme.txt`: This file 