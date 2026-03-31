# Expression Syntax Highlighting for Bubble
Developed by Brenton Strine

This document categorizes Bubble's expression operators and comparisons into functional and syntactic groups, moving beyond the data-type-specific groupings in the official documentation. Understanding these categories can make building and debugging complex expressions much easier.

## The Three Core Syntactic Categories

Every operation in Bubble falls into one of three syntactic patterns:

1.  **Infix Operators:** These operators are placed *between* two values (operands) to perform a calculation, comparison, or combination. They are the most traditional-looking operators.
    *   `value1 + value2`
    *   `date1 > date2`
    *   `list1 merged with list2`

2.  **Chained Operators (Modifiers):** Always prefixed with a colon (`:`), these are appended to the end of an expression. They act on the preceding value to modify it, format it, perform an aggregation, or convert its type. This is the most common operator type in Bubble.
    *   `my_text:truncated to 5`
    *   `my_list:first item`
    *   `my_number:formatted as...`

3.  **Property Accessors:** These use an apostrophe-s (`'s`) to read a built-in property from a complex data object (a "Thing"). These are always read-only operations.
    *   `Current User's email`
    *   `This file's URL`
    *   `This address's latitude`

---

## Detailed Operator Breakdown

### 1. Infix Operators

These operators always have a value on both the left and right side.

*   **Mathematical:** `+`, `-`, `*`, `/`, `^` (exponent), `<-modulo->`
*   **Comparison (return yes/no):** `is`, `is not`, `=`, `<>`, `>`, `≥`, `<`, `≤`, `is in`, `is not in`, `contains`, `doesn't contain`, `contains keyword(s)`, `doesn't contain keyword(s)`, `overlaps with`, `is empty`, `is not empty`
*   **Logical (return yes/no):** `and`, `or`
*   **List/Set Manipulation:** `merged with`, `intersect with`, `minus list`
*   **Range & Value Creators:** `< - range ->` (creates a number or date range), `-` (subtracting two dates to create a date interval)
*   **Value Selectors:** `< - max ->`, `< - min ->` (returns the larger or smaller of two numbers/dates)

### 2. Chained Operators (`:`)

These modify the value they are attached to.

*   **Formatters:** Change the text representation of a value.
    *   `:formatted as...` (The most common formatter for numbers, dates, booleans, etc.)
    *   `:capitalized words`, `:uppercase`, `:lowercase`
    *   `:join with...` (Converts a list to a single text.)
*   **Manipulators:** Change the data or create a new version of it.
    *   `:trimmed`, `:truncated to`, `:append`, `:find/replace` (Text)
    *   `:rounded to`, `:floor`, `:ceiling` (Number)
    *   `:plus item`, `:minus item`, `:sorted`, `:unique elements`, `:filtered` (List)
    *   `+(days)`, `change date to` (Date)
*   **Data Extractors:** Pull a piece of information from a value.
    *   `:number of characters`, `:extract...`, `:extract with Regex` (Text)
    *   `:first item`, `:last item`, `:item #`, `:items from #` (List)
    *   `Extract from date` (e.g., get the month)
*   **Aggregators:** Perform a calculation on an entire list.
    *   `:count`, `:sum`, `:average`, `:median`, `:min`, `:max`, `:group by`
*   **Type Converters:** Change the fundamental data type.
    *   `:converted to number`, `:converted to list`, `:split by...`
*   **Fallbacks:** Provide a value if the original is empty.
    *   `:defaulting to`
*   **Special Actions:** Perform a server-side action.
    *   `:saved to Bubble Storage`, `:processed with Imgix`, `:encoded in base64`

### 3. Property Accessors (`'s`)

These read a fixed property from a Bubble object.

*   **Universal Thing Properties:** `Creator`, `Created Date`, `Modified Date`, `Slug`, `'s unique id`
*   **File/Image Properties:** `'s file name`, `'s URL`
*   **Geographic Address Properties:** `'s latitude`, `'s longitude`, `'s formatted address`, `'s time zone ID`
*   **User-Specific Properties:** `Email`, `'s email confirmed`, `is logged in`

---

## Syntax Highlighting Strategy

A successful syntax highlighting strategy must strike a balance. Too many colors create a chaotic "rainbow" effect that is overwhelming, while too few colors fail to provide meaningful visual cues. An ideal range is **3-5 distinct colors** plus the default text color.

### Final Strategy

Start with Data Sources in blue. All expressions must have a data source, and blue is the default color for expressions so it makes sense.  Data source is also in a bold font weight.

Properties are an extension of the Data Source so they're a similar color. The color is slightly lighter, which is a subtle difference, but the font weight difference also helps distinguish.

Chained operators are "background noise" in green.

Infix operators need to stand out with purple.

Logical `and` and `or` are among the most important operators as they join sub-expressions, so they are red. Literals need to stand out to differentiate them from other syntax, so a bright orange is used. 

Comparisons do something similar to the logical operators, however they have a drastically different purpose and aren't the same level of importance. They deserve to have their own color because in some contexts (e.g. a condition) a comparison is required somewhere in the expression. They are a very important type of infix operator, so magenta works as it's an intense purple.

* Blue: All **Data Sources** (`Current User`).
* DodgerBlue: All **Property Accessors** (`'s unique id`).
* Green: All **Chained Operators** (`:formatted as`, `:count`).
* Purple: All other **Infix Operators** (`is`, `+`, `merged with`).
* Red: All **Logical** (`and`, `or`).
* Magenta: All **Comparison** (`is`, `contains`).
* Orange: Literals and static values (text strings, numbers).