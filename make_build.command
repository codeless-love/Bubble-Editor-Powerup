#!/bin/bash

# In MacOS, this script creates a compressed ZIP of the project suitable for uploading to the Google Chrome web store or manually loading into your browser. The default compressor on the latest MacOS versions makes a ZIP which won't work. 
# To run this script, simply open the directory in finder and double-click this file. No need to use a terminal.

# Move to the folder this script is in
cd "$(dirname "$0")"

# Get version from manifest.json
VERSION=$(grep '"version"' manifest.json | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "Error: Could not extract version from manifest.json"
  exit 1
fi

# Set base name and start ZIP path
BASENAME="v$VERSION"
ZIP_NAME="$BASENAME.zip"
ZIP_PATH="../$ZIP_NAME"

# Auto-increment if file already exists
i=1
while [ -e "$ZIP_PATH" ]; do
  ZIP_NAME="$BASENAME ($i).zip"
  ZIP_PATH="../$ZIP_NAME"
  ((i++))
done

# Create the zip archive, excluding macOS metadata
zip -r "$ZIP_PATH" . -x '*.DS_Store' -x '__MACOSX' -x '*/__MACOSX/*' -x '._*'

echo "Successfully created $ZIP_PATH in parent directory!"
echo "You can close this terminal now."
