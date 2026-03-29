# HOW TO ADD A NEW FEATURE

## SUMMARY

1. Duplicate this folder (/new_features_go_here) and the files inside it.
   IMPORTANT: Leave this example folder in place unaltered, so that future devs
   can use it!
2. Change the folder and file names to match your feature key name.
3. Add code to the CSS and JS files.
4. Update features.json with a new object following the pattern in that style.
   IMPORTANT: Duplicate the example object, don't replace it. Leave the example
   object in place for future devs.
5. Delete this readme from your duplicated folder.
6. Submit a Pull Request!

## THINGS TO NOTE

Every feature has a FEATURE NAME and a FEATURE KEY.

 * The Feature Name should be the same everywhere so that future devs can
   understand which feature is doing what during debugging.
 * The Feature Key (named feature_key_goes_here in all the examples) MUST be
   identical everywhere, so that your feature can be properly injected into the
   browser tab.

## HEART INDICATORS

You should implement a heart indicator (just a little heart emoji) along with
your feature. The purpose of this is to make it clear that the Bubble editor has
been changed in that spot. This way if developers are running into issues, the
heart indicator can remind them that it might be caused by the extension. It
also helps devs understand and find what is actually being modified in the
Bubble editor when they enable/disable a feature.

## CSS ❤️ codelesslove SELECTOR

Every CSS rule should start with the selector `❤️ codelesslove,`. This does
nothing functionally, but helps with debugging as a searchable, filterable
identifier to allow devs to easily see which CSS rules are from the extension.

## UNDERSTANDING THE FEATURE SCRIPT ISOLATED CONTEXT

Scripts from an extension run in what's called an "isolated world." The
page/tab's context is called the "main world." In this isolated world:

 * You can't access JavaScript variables in the main world, nor can the main
   world reach vars from the isolated world.

When the service worker (background.js) loads scripts, (called "content
scripts") each content script runs in its own isolated world, which means:

 * Content scripts can't access variables from other content scripts.

However, all of these isolated scripts CAN:

 * See and manipulate the page DOM
 * Log to the page console
 * Access long list of additional APIs like window.location, MutationObserver,
   localStorage, sessionStorage, etc.

There are rare situations where a feature may need to have access to the main
world. In this case, a script can be injected via message passing. This is done
by passing a message with the action name "injectScriptIntoMainWorld" from the
content script to the background script. The background script can then inject
the script into the main world where it can interact with the page's JS.
