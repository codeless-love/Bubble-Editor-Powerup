# Hide Heart Indicators Feature

## Overview

The **Hide Heart Indicators** feature removes all heart (❤️) visual indicators that the Bubble Editor Powerup extension adds throughout the interface. These hearts normally show which elements have been modified by the extension, but this feature provides a cleaner interface by hiding them while preserving all underlying functionality.

## Feature Details

- **Feature Key**: `hide_heart_indicators`
- **Category**: Style Tab
- **Type**: CSS-only feature
- **Default**: Disabled (users must opt-in)
- **Target**: All heart indicators added by extension features

## Implementation

### Files Created
- `features/hide_heart_indicators/hide_heart_indicators.css` - Main CSS file with heart-hiding rules
- `features.json` - Updated with feature configuration

### Technical Approach

Instead of modifying the source CSS of other features (which would be destructive), this feature uses CSS cascade to hide hearts after they're rendered:

```css
❤️ codelesslove,/* Example rule */
.some-element:hover::after {
  display: none !important;
}
```

**Why this approach:**
- ✅ Non-destructive to original features
- ✅ Reversible (toggle on/off)
- ✅ Maintainable (all rules in one place)
- ✅ Community-friendly (doesn't break other features)

### Coverage Areas

The feature targets heart indicators from these extension features:

**Data View:**
- Option set expand inputs
- Option set limitless attribute lists  
- Option set move gaps
- Data copy warnings

**Privacy:**
- Privacy status badges (hover)
- Privacy field captions (hover)
- Permission labels (hover)

**Workflows:**
- Workflow editor folders
- Branch management

**Interface Elements:**
- Top menu/AIM dropdown
- Sidebar elements
- Search palette
- Canvas left align
- Style variables (hover)

**Property Editor:**
- Expression composers
- Text input hitboxes
- Element property fields

**Runtime:**
- Element explorer
- Main branch warnings

## Development Process Followed

### 1. Initial Setup
```bash
# Duplicated template folder
cp -r "features/feature_key_goes_here" "features/hide_heart_indicators"

# Renamed files to match feature key
mv feature_key_goes_here.css hide_heart_indicators.css
mv feature_key_goes_here.js hide_heart_indicators.js  # Later removed (CSS-only)

# Cleaned up template files
rm readme.txt example_script_that_must_execute_in_the_main_world.js
```

### 2. Community Guidelines Compliance
- ✅ Used snake_case naming: `hide_heart_indicators`
- ✅ All CSS rules prefixed with `❤️ codelesslove,`
- ✅ Followed template structure exactly
- ✅ Added proper feature configuration to `features.json`
- ✅ Set `default: false` for opt-in behavior

### 3. Iterative Development
1. **Research Phase**: Analyzed existing heart indicators across all features
2. **Testing Phase**: Used aggressive universal rules for testing
3. **Refinement Phase**: Replaced with specific, targeted selectors  
4. **User Testing**: Added selectors based on real usage feedback
5. **Optimization**: Consolidated and organized rules

### 4. Feature Configuration
```json
{
  "key": "hide_heart_indicators",
  "category": "Style Tab",
  "name": "Hide Heart Indicators", 
  "description": "Hides all heart (❤️) indicators that the extension adds to show which elements have been modified. This provides a cleaner interface without the visual indicators.",
  "cssFile": "features/hide_heart_indicators/hide_heart_indicators.css",
  "default": false
}
```

## User Guide

### How to Enable
1. Open the Bubble Editor Powerup extension options
2. Navigate to the **"Style Tab"** section
3. Find **"Hide Heart Indicators"**
4. Toggle it **ON**
5. Hearts will immediately disappear from the interface

### How to Disable
1. Return to extension options
2. Toggle **"Hide Heart Indicators"** OFF
3. Hearts will reappear to show extension modifications

### What It Does
- ❌ **Removes visual hearts** from all extension-modified elements
- ✅ **Preserves all functionality** of other features
- ✅ **Provides cleaner interface** without visual indicators
- ✅ **Works immediately** (no page refresh needed)

### What It Doesn't Do
- ❌ Doesn't disable or break other extension features
- ❌ Doesn't affect non-heart visual indicators  
- ❌ Doesn't modify the underlying functionality

## Troubleshooting

### Hearts Still Showing?
If you see hearts that aren't being hidden:

1. **Inspect Element**: Right-click heart → "Inspect Element"
2. **Find CSS Selector**: Look for the `::after` or `::before` rule adding the heart
3. **Report Issue**: Provide the specific selector so it can be added

### Feature Not Working?
1. Ensure extension is enabled and updated
2. Check that "Hide Heart Indicators" is toggled ON
3. Try reloading the Bubble editor page
4. Check browser console for any errors

## Technical Details

### CSS Specificity
- Uses `!important` to ensure rules override original features
- Targets specific selectors rather than broad universal rules
- Maintains performance with efficient CSS selectors

### Browser Compatibility
- Works in all Chromium-based browsers (Chrome, Edge, etc.)
- CSS-only implementation ensures maximum compatibility
- No JavaScript dependencies

### Performance Impact
- Minimal: CSS `display: none` is highly optimized
- No runtime JavaScript execution
- Lightweight: ~5KB CSS file

## Maintenance

### Adding New Selectors
When new extension features add hearts, follow this pattern:

```css
❤️ codelesslove,/* Description of what this targets */
.specific-selector::after,
.another-selector:hover::before {
  display: none !important;
}
```

### Testing New Rules
1. Add selector to CSS
2. Reload extension in chrome://extensions/
3. Test in Bubble editor
4. Verify heart is hidden without breaking functionality

## Contributing

This feature serves as a good example of:
- ✅ Community-friendly development practices
- ✅ Non-destructive CSS techniques  
- ✅ Proper extension architecture
- ✅ User-centered design (opt-in by default)

Future contributors can follow this same methodology for similar visual modification features.