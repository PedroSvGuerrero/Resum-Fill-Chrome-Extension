// ─── ResuméFill · popup.js ────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  resume: {
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    linkedin: "",
    website: "",
    github: "",
    title: "",
    summary: "",
    employer: "",
    salary: "",
    school: "",
    degree: "",
    gradYear: "",
  }
};

const SECTIONS = [
  {
    id: "personal",
    label: "Personal",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
    fields: [
      { key: "firstName", label: "First Name",  type: "text" },
      { key: "lastName",  label: "Last Name",   type: "text" },
      { key: "fullName",  label: "Full Name",   type: "text" },
      { key: "email",     label: "Email",        type: "email" },
      { key: "phone",     label: "Phone",        type: "tel" },
      { key: "title",     label: "Job Title",    type: "text" },
    ]
  },
  {
    id: "location",
    label: "Location",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-6.3-8-12a8 8 0 1 1 16 0c0 5.7-8 12-8 12z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
    fields: [
      { key: "address", label: "Street Address", type: "text" },
      { key: "city",    label: "City",            type: "text" },
      { key: "state",   label: "State",           type: "text" },
      { key: "zip",     label: "ZIP Code",        type: "text" },
      { key: "country", label: "Country",         type: "text" },
    ]
  },
  {
    id: "links",
    label: "Links",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    fields: [
      { key: "linkedin", label: "LinkedIn URL", type: "url" },
      { key: "website",  label: "Portfolio URL", type: "url" },
      { key: "github",   label: "GitHub URL",    type: "url" },
    ]
  },
  {
    id: "professional",
    label: "Professional",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
    fields: [
      { key: "employer", label: "Current Employer", type: "text" },
      { key: "salary",   label: "Expected Salary",  type: "text" },
      { key: "summary",  label: "Professional Summary", type: "textarea" },
    ]
  },
  {
    id: "education",
    label: "Education",
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`,
    fields: [
      { key: "school",   label: "School / University", type: "text" },
      { key: "degree",   label: "Degree / Major",      type: "text" },
      { key: "gradYear", label: "Graduation Year",     type: "text" },
    ]
  },
];

let profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
let activeTab = "personal";

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.sync.get("resumeProfile");
  if (stored.resumeProfile) profile = stored.resumeProfile;

  renderNav();
  renderSection(activeTab);
  bindFillButton();
  bindSaveButton();
});

// ─── Nav ──────────────────────────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = SECTIONS.map(s => `
    <button class="nav-btn ${s.id === activeTab ? "active" : ""}" data-tab="${s.id}">
      ${s.icon} ${s.label}
    </button>
  `).join("");

  nav.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      saveCurrentSection();
      activeTab = btn.dataset.tab;
      renderNav();
      renderSection(activeTab);
    });
  });
}

// ─── Section render ───────────────────────────────────────────────────────
function renderSection(tabId) {
  const section = SECTIONS.find(s => s.id === tabId);
  const form = document.getElementById("form-body");

  form.innerHTML = section.fields.map(f => {
    const val = profile.resume?.[f.key] || "";
    const isTextarea = f.type === "textarea";
    const input = isTextarea
      ? `<textarea class="field-input" data-key="${f.key}" rows="4">${val}</textarea>`
      : `<input class="field-input" type="${f.type}" data-key="${f.key}" value="${val}" autocomplete="off" />`;
    return `
      <div class="field-row">
        <label class="field-label">${f.label}</label>
        ${input}
      </div>
    `;
  }).join("");
}

// ─── Save current form values into profile object ─────────────────────────
function saveCurrentSection() {
  document.querySelectorAll(".field-input").forEach(el => {
    profile.resume[el.dataset.key] = el.value.trim();
  });
}

// ─── Save to storage ──────────────────────────────────────────────────────
function bindSaveButton() {
  document.getElementById("btn-save").addEventListener("click", async () => {
    saveCurrentSection();
    await chrome.storage.sync.set({ resumeProfile: profile });
    showToast("Profile saved ✓");
  });
}

// ─── Inject fill command into active tab ──────────────────────────────────
function bindFillButton() {
  document.getElementById("btn-fill").addEventListener("click", async () => {
    saveCurrentSection();
    await chrome.storage.sync.set({ resumeProfile: profile });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "fill", profile });
    showToast("Form filled ✓");
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
