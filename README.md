# Codeless Love Bubble Editor Powerup

This Chrome extension enhances your Bubble.io editor and improves the UI. It's
free to use and maintained by the Bubble community! You can contribute by:

 * Reporting bugs
 * Suggesting Features
 * Modifying the codebase

See the sections below for more information on how to contribute.

This extension is available to install from the [Chrome Web Store](https://chromewebstore.google.com/detail/codeless-love-bubble-edit/imaakngdpjbnlgajekmhpiigibmgmial) or you may install it to your browser directly using instructions [below](#how-to-install-from-source).

## Features
https://www.loom.com/share/9a836dc9bbfb4fb7ac7c6d919732fd90?sid=36020ef4-1d8a-455a-bbe3-7ed90bfa2943

### Styles
#### Style row hover
When hovering a color or font variable, a background color appears, making it easier to see which row is being modified. 

### Expression Bad Practice Warnings
https://www.loom.com/share/f77b2c135f7f4337b03605658ad50d76?sid=15f6473d-8cfb-4712-9a23-7c5eacdf8e8e


## How to contribute
https://www.loom.com/share/051e57b9fcab471eae7910ab8f4dc4eb?sid=74f25d0e-f57c-46a0-834e-3aee50b77742

### Making Your First Pull Request
https://www.loom.com/share/01368973bccf4f6f9336aa654360703a?sid=8417e388-0d0c-402c-a210-a61fd9382872

## How to add new features in the codebase
1. Create a new folder under **features/** for your new feature.
2. Add its cssFile and jsFile references to `featuresConfig` in **background.js** (with a unique key).
3. Create a new checkbox in **options.html**, referencing the same key -- but like `opt-some-new-feature`.

## How to Install from Source
If you don't want to use the Chrome Web Store, you may install this extension to
your browser manually.

1. Download the Source Code
   1. Go to https://github.com/codeless-love/Bubble-Editor-Powerup
   1. Click the big green button <> Code then select Download ZIP
   1. Navigate to the ZIP file and decompress it.
1. Manually Load the Extension into Chrome
   1. Go to [chrome://extensions/](chrome://extensions/)
   1. Click Developer Mode in the top right to enable it
   1. Click the "Load Unpacked" button
   1. Select the compressed ZIP file you downloaded in step 1.
