# ResuméFill — Chrome Extension

A lightweight Chrome extension that detects and autofills job application forms across any website using a stored resume profile.

Built with Manifest V3. No external dependencies. Works with React/Vue-controlled inputs (Workday, Greenhouse, Lever, iCIMS, etc.).

---

## Features

- **5-section profile editor** — Personal, Location, Links, Professional, Education
- **Universal field matcher** — heuristic detection via `name`, `id`, `placeholder`, `aria-label`, and closest `<label>` text
- **SPA support** — `MutationObserver` refills forms injected dynamically after page load
- **Framework compatibility** — native value setter trick ensures React/Vue state updates register correctly
- **Chrome sync storage** — profile persists across devices via your Google account

---

## Installation (Developer Mode)

1. Clone or download this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select this folder
5. Pin the extension from the puzzle-piece menu

---

## Usage

1. Click the **RF** icon in the toolbar
2. Fill in your resume profile across the tabs
3. Click **Save Profile**
4. Navigate to any job application page
5. Click **Fill Page** — fields are matched and populated instantly

---

## File Structure

```
resume-autofill/
├── manifest.json        # MV3 config
├── content_script.js    # Form detector + filler (injected on all pages)
├── popup.html           # Extension popup shell
├── popup.js             # Tab navigation, storage, fill trigger
├── popup.css            # UI styles
├── icon16.png
├── icon48.png
└── icon128.png
```

---

## Field Matching Logic

Each input element is scored against a label string built from:
```
el.name + el.id + el.placeholder + aria-label + closest <label> text
```

This string is matched against keyword pattern arrays defined in `FIELD_MAP` inside `content_script.js`. First match wins.

To add a new field:

```js
// In content_script.js → FIELD_MAP
{ keys: ["resume.myField"], patterns: ["my label", "alternate label"] },

// In popup.js → SECTIONS
{ key: "myField", label: "My Field", type: "text" },
```

---

## Roadmap

- [ ] Claude API field classifier for ambiguous labels
- [ ] Per-domain overrides (e.g. skip salary on specific sites)
- [ ] Import profile from LinkedIn PDF
- [ ] Firefox support (MV3 compatible)
- [ ] Export / import profile as JSON

---

## License

MIT# Resum-Fill-Chrome-Extension
