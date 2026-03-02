

## Plan: Always Scroll to Category Top on Selection

**Problem**: When switching categories via the quick-nav icons, the scroll position doesn't consistently land at the top of the newly opened category — especially if you were scrolled deep in a previous category.

**Fix in `EquipmentSelector.tsx`**:
- In `handleCategoryClick`, first close the current category (set to `undefined`), then after a brief delay set the new category and scroll to its top. This ensures the accordion collapses first, repositioning the target element, then opens and scrolls cleanly.
- Increase the `setTimeout` delay slightly (e.g., 150ms) to allow the accordion close animation to complete before scrolling.

**Regarding your question**: You can save a note/memory like: *"When navigating to a new section or category, always scroll to the top of that section."* — and I'll follow that convention in future changes. Want me to save this as a guideline?

