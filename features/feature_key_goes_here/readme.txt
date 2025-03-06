# HOW TO ADD A NEW FEATURE

## SUMMARY

1. Duplicate this folder (/new_features_go_here) and the files inside it.
   IMPORTANT: Leave this example folder in place unaltered, so that future devs
   can use it!
2. Add code to the CSS and JS files.
3. Update features.json with a new object following the pattern in that style.
   IMPORTANT: Duplicate the example object, don't replace it. Leave the example
   object in place for future devs.
4. Delete this readme from your duplicated folder.
5. Submit a Pull Request!

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
