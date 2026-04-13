// ─── ResuméFill · content_script.js ───────────────────────────────────────

let RESUME = {};

// Load profile from storage
chrome.storage.sync.get("resumeProfile", ({ resumeProfile }) => {
  if (resumeProfile) RESUME = resumeProfile;
});

// Listen for fill command from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "fill") {
    RESUME = msg.profile;
    fillAll();
    return true;
  }
});

// ─── Field mapping: keyword patterns → profile key ────────────────────────
const FIELD_MAP = [
  { keys: ["resume.firstName"],  patterns: ["first name", "first_name", "fname", "given name", "forename"] },
  { keys: ["resume.lastName"],   patterns: ["last name", "last_name", "lname", "family name", "surname"] },
  { keys: ["resume.fullName"],   patterns: ["full name", "fullname", "your name", "name"] },
  { keys: ["resume.email"],      patterns: ["email", "e-mail", "correo"] },
  { keys: ["resume.phone"],      patterns: ["phone", "mobile", "cell", "telephone", "tel"] },
  { keys: ["resume.address"],    patterns: ["street address", "address line 1", "street"] },
  { keys: ["resume.city"],       patterns: ["city", "ciudad", "town"] },
  { keys: ["resume.state"],      patterns: ["state", "province", "region"] },
  { keys: ["resume.zip"],        patterns: ["zip", "postal", "post code"] },
  { keys: ["resume.country"],    patterns: ["country", "nation"] },
  { keys: ["resume.linkedin"],   patterns: ["linkedin"] },
  { keys: ["resume.website"],    patterns: ["website", "portfolio", "url", "personal site"] },
  { keys: ["resume.github"],     patterns: ["github", "git"] },
  { keys: ["resume.title"],      patterns: ["job title", "current title", "position", "headline", "professional title"] },
  { keys: ["resume.summary"],    patterns: ["summary", "about", "bio", "cover", "objective", "statement"] },
  { keys: ["resume.employer"],   patterns: ["current employer", "current company", "employer", "company name"] },
  { keys: ["resume.salary"],     patterns: ["salary", "compensation", "expected salary", "desired salary"] },
  { keys: ["resume.school"],     patterns: ["university", "college", "school", "institution", "alma mater"] },
  { keys: ["resume.degree"],     patterns: ["degree", "major", "field of study", "discipline"] },
  { keys: ["resume.gradYear"],   patterns: ["graduation year", "grad year", "year graduated"] },
];

// ─── Resolve dot-notation key from RESUME object ──────────────────────────
function resolve(path) {
  return path.split(".").reduce((obj, k) => obj?.[k], RESUME) || "";
}

// ─── Build a label string from all identifiers of an element ──────────────
function getLabel(el) {
  const parts = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute("aria-label"),
    el.getAttribute("aria-labelledby")
      ? document.getElementById(el.getAttribute("aria-labelledby"))?.textContent
      : null,
    el.closest("label")?.textContent,
    el.labels?.[0]?.textContent,
    el.getAttribute("data-field"),
    el.getAttribute("autocomplete"),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase().replace(/[_\-]/g, " ");
}

// ─── Native value setter (works with React/Vue controlled inputs) ──────────
function nativeSet(el, value) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, "value"
  )?.set;
  const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, "value"
  )?.set;

  if (el.tagName === "TEXTAREA") {
    nativeTextareaSetter?.call(el, value);
  } else {
    nativeInputValueSetter?.call(el, value);
  }
  el.dispatchEvent(new Event("input",  { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur",   { bubbles: true }));
}

// ─── Try to fill a single input ───────────────────────────────────────────
function fillInput(el) {
  if (el.type === "submit" || el.type === "button" ||
      el.type === "hidden"  || el.type === "file"  ||
      el.readOnly || el.disabled) return;

  const label = getLabel(el);
  if (!label) return;

  for (const { keys, patterns } of FIELD_MAP) {
    if (patterns.some(p => label.includes(p))) {
      const value = resolve(keys[0]);
      if (value && !el.value) {
        nativeSet(el, value);
      }
      return;
    }
  }
}

// ─── Fill selects (state, country) ───────────────────────────────────────
function fillSelect(el) {
  const label = getLabel(el);
  let target = "";

  if (["state", "province", "region"].some(p => label.includes(p))) {
    target = resolve("resume.state");
  } else if (["country"].some(p => label.includes(p))) {
    target = resolve("resume.country");
  }

  if (!target) return;

  const opt = Array.from(el.options).find(o =>
    o.value.toLowerCase().includes(target.toLowerCase()) ||
    o.text.toLowerCase().includes(target.toLowerCase())
  );
  if (opt) {
    el.value = opt.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// ─── Main fill function ───────────────────────────────────────────────────
function fillAll() {
  if (!RESUME?.resume) return;

  document.querySelectorAll("input, textarea").forEach(fillInput);
  document.querySelectorAll("select").forEach(fillSelect);
}

// ─── Watch for dynamically injected forms (SPAs) ─────────────────────────
const observer = new MutationObserver(() => {
  // Debounce
  clearTimeout(observer._timer);
  observer._timer = setTimeout(fillAll, 400);
});
observer.observe(document.body, { childList: true, subtree: true });
