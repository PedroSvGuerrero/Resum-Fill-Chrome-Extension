// ─── ResuméFill · content_script.js ───────────────────────────────────────
// Fills ONLY when "Fill Page" is clicked. No automatic triggering.

let RESUME = {};

// ─── Only source of truth: message from popup ─────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "fill") {
    RESUME = msg.profile;
    fillAll();
    return true;
  }
});

// ─── Field mapping ────────────────────────────────────────────────────────
const FIELD_MAP = [
  { key: "resume.firstName",  patterns: ["first name", "first name", "fname", "given name", "forename"] },
  { key: "resume.lastName",   patterns: ["last name", "last name", "lname", "family name", "surname"] },
  { key: "resume.fullName",   patterns: ["full name", "fullname", "your name", "name"] },
  { key: "resume.email",      patterns: ["email", "e mail", "correo"] },
  { key: "resume.phone",      patterns: ["phone", "mobile", "cell", "telephone", "tel"] },
  { key: "resume.address",    patterns: ["street address", "address line 1", "street"] },
  { key: "resume.city",       patterns: ["city", "ciudad", "town"] },
  { key: "resume.state",      patterns: ["state", "province", "region"] },
  { key: "resume.zip",        patterns: ["zip", "postal", "post code"] },
  { key: "resume.country",    patterns: ["country", "nation"] },
  { key: "resume.linkedin",   patterns: ["linkedin"] },
  { key: "resume.website",    patterns: ["website", "portfolio", "personal site"] },
  { key: "resume.github",     patterns: ["github", "git"] },
  { key: "resume.title",      patterns: ["job title", "current title", "headline", "professional title"] },
  { key: "resume.summary",    patterns: ["summary", "about", "bio", "cover", "objective", "statement"] },
  { key: "resume.salary",     patterns: ["salary", "compensation", "expected salary", "desired salary"] },
  { key: "resume.jobs.0.employer", patterns: ["current employer", "current company", "employer", "company name", "organization"] },
  { key: "resume.jobs.0.title",    patterns: ["current role", "current position", "most recent title"] },
  { key: "resume.education.0.school",   patterns: ["university", "college", "school", "institution", "alma mater"] },
  { key: "resume.education.0.degree",   patterns: ["degree", "major", "field of study", "discipline"] },
  { key: "resume.education.0.gradYear", patterns: ["graduation year", "grad year", "year graduated"] },
];

// ─── Resolve dot-notation + array index ───────────────────────────────────
function resolve(path) {
  return path.split(".").reduce((obj, k) => {
    if (obj === undefined || obj === null) return "";
    return isNaN(k) ? obj[k] : obj[parseInt(k)];
  }, RESUME) || "";
}

// ─── Build label string from element attributes ────────────────────────────
function getLabel(el) {
  const parts = [
    el.name, el.id, el.placeholder,
    el.getAttribute("aria-label"),
    el.getAttribute("aria-labelledby")
      ? document.getElementById(el.getAttribute("aria-labelledby"))?.textContent : null,
    el.closest("label")?.textContent,
    el.labels?.[0]?.textContent,
    el.getAttribute("data-field"),
    el.getAttribute("autocomplete"),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase().replace(/[_\-]/g, " ");
}

// ─── Native setter — works with React/Vue controlled inputs ───────────────
function nativeSet(el, value) {
  const inputSetter    = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,    "value")?.set;
  const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
  if (el.tagName === "TEXTAREA") textareaSetter?.call(el, value);
  else inputSetter?.call(el, value);
  el.dispatchEvent(new Event("input",  { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur",   { bubbles: true }));
}

// ─── Fill a single input ──────────────────────────────────────────────────
function fillInput(el) {
  if (["submit","button","hidden","file"].includes(el.type)) return;
  if (el.readOnly || el.disabled) return;
  const label = getLabel(el);
  if (!label) return;
  if (["skill", "skills", "competenc"].some(p => label.includes(p))) return; // handled separately

  for (const { key, patterns } of FIELD_MAP) {
    if (patterns.some(p => label.includes(p))) {
      const value = resolve(key);
      if (value && !el.value) nativeSet(el, value);
      return;
    }
  }
}

// ─── Fill selects ─────────────────────────────────────────────────────────
function fillSelect(el) {
  const label = getLabel(el);
  let target = "";
  if (["state","province","region"].some(p => label.includes(p))) target = resolve("resume.state");
  else if (["country"].some(p => label.includes(p))) target = resolve("resume.country");
  if (!target) return;
  const opt = Array.from(el.options).find(o =>
    o.value.toLowerCase().includes(target.toLowerCase()) ||
    o.text.toLowerCase().includes(target.toLowerCase())
  );
  if (opt) { el.value = opt.value; el.dispatchEvent(new Event("change", { bubbles: true })); }
}

// ─── Skills: type each skill into tag-input fields ────────────────────────
async function fillSkills() {
  const skills = RESUME?.resume?.skills;
  if (!skills || skills.length === 0) return;

  const allInputs = Array.from(document.querySelectorAll("input, textarea"));
  const skillInputs = allInputs.filter(el => {
    const label = getLabel(el);
    return ["skill", "skills", "competenc", "expertise", "tecnolog"].some(p => label.includes(p));
  });

  for (const el of skillInputs) {
    el.focus();
    await delay(200);

    if (el.tagName === "TEXTAREA") {
      nativeSet(el, skills.join(", "));
      continue;
    }

    // Tag-input: type each skill and press Enter
    for (const skill of skills) {
      el.focus();
      nativeSet(el, skill);
      await delay(150);
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", keyCode: 13, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keyup",   { key: "Enter", keyCode: 13, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent("keydown", { key: ",",     keyCode: 188, bubbles: true }));
      await delay(300);
      nativeSet(el, "");
    }
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── Main — only runs on explicit "Fill Page" click ───────────────────────
async function fillAll() {
  if (!RESUME?.resume) return;
  document.querySelectorAll("input, textarea").forEach(fillInput);
  document.querySelectorAll("select").forEach(fillSelect);
  await fillSkills();
}
