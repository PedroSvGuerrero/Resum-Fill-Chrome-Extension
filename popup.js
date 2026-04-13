// ─── ResuméFill · popup.js ────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  resume: {
    firstName: "", lastName: "", fullName: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "", country: "",
    linkedin: "", website: "", github: "",
    title: "", summary: "", salary: "",
    skills: [],
    jobs: [{ employer: "", title: "", startDate: "", endDate: "", current: false, description: "" }],
    education: [{ school: "", degree: "", field: "", gradYear: "" }],
  }
};

let profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
let activeTab = "personal";

const STATIC_SECTIONS = [
  {
    id: "personal", label: "Personal",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
    fields: [
      { key: "firstName", label: "First Name",  type: "text" },
      { key: "lastName",  label: "Last Name",   type: "text" },
      { key: "fullName",  label: "Full Name",   type: "text" },
      { key: "email",     label: "Email",        type: "email" },
      { key: "phone",     label: "Phone",        type: "tel" },
      { key: "title",     label: "Job Title",    type: "text" },
      { key: "salary",    label: "Expected Salary", type: "text" },
    ]
  },
  {
    id: "location", label: "Location",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-6.3-8-12a8 8 0 1 1 16 0c0 5.7-8 12-8 12z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
    fields: [
      { key: "address", label: "Street Address", type: "text" },
      { key: "city",    label: "City",            type: "text" },
      { key: "state",   label: "State",           type: "text" },
      { key: "zip",     label: "ZIP Code",        type: "text" },
      { key: "country", label: "Country",         type: "text" },
    ]
  },
  {
    id: "links", label: "Links",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    fields: [
      { key: "linkedin", label: "LinkedIn URL",  type: "url" },
      { key: "website",  label: "Portfolio URL", type: "url" },
      { key: "github",   label: "GitHub URL",    type: "url" },
    ]
  },
  {
    id: "summary", label: "Summary",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>`,
    fields: [
      { key: "summary", label: "Professional Summary", type: "textarea" },
    ]
  },
];

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.sync.get("resumeProfile");
  if (stored.resumeProfile) profile = stored.resumeProfile;
  // Ensure arrays exist (backward compat)
  profile.resume.skills    = profile.resume.skills    || [];
  profile.resume.jobs      = profile.resume.jobs      || DEFAULT_PROFILE.resume.jobs;
  profile.resume.education = profile.resume.education || DEFAULT_PROFILE.resume.education;

  renderNav();
  renderSection(activeTab);
  bindFillButton();
  bindSaveButton();
});

// ─── Nav ──────────────────────────────────────────────────────────────────
const ALL_TABS = [
  ...STATIC_SECTIONS.map(s => ({ id: s.id, label: s.label, icon: s.icon })),
  { id: "skills",    label: "Skills",    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>` },
  { id: "jobs",      label: "Experience", icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>` },
  { id: "education", label: "Education", icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>` },
];

function renderNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = ALL_TABS.map(t => `
    <button class="nav-btn ${t.id === activeTab ? "active" : ""}" data-tab="${t.id}">
      ${t.icon} ${t.label}
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

// ─── Section dispatcher ───────────────────────────────────────────────────
function renderSection(tabId) {
  if (tabId === "skills")    return renderSkills();
  if (tabId === "jobs")      return renderJobs();
  if (tabId === "education") return renderEducation();
  const section = STATIC_SECTIONS.find(s => s.id === tabId);
  const form = document.getElementById("form-body");
  form.innerHTML = section.fields.map(f => {
    const val = profile.resume?.[f.key] || "";
    const input = f.type === "textarea"
      ? `<textarea class="field-input static-field" data-key="${f.key}" rows="5">${val}</textarea>`
      : `<input class="field-input static-field" type="${f.type}" data-key="${f.key}" value="${val}" autocomplete="off" />`;
    return `<div class="field-row"><label class="field-label">${f.label}</label>${input}</div>`;
  }).join("");
}

// ─── Skills tab ───────────────────────────────────────────────────────────
function renderSkills() {
  const form = document.getElementById("form-body");
  form.innerHTML = `
    <div class="field-row">
      <label class="field-label">Add Skill</label>
      <div class="skill-input-row">
        <input id="skill-input" class="field-input" type="text" placeholder="e.g. Legal Research" autocomplete="off" />
        <button id="skill-add" class="btn-add" title="Add skill">+</button>
      </div>
    </div>
    <div id="skill-tags" class="tag-container"></div>
  `;
  renderSkillTags();

  document.getElementById("skill-add").addEventListener("click", addSkill);
  document.getElementById("skill-input").addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(); }
  });
}

function renderSkillTags() {
  const container = document.getElementById("skill-tags");
  if (!container) return;
  container.innerHTML = (profile.resume.skills || []).map((s, i) => `
    <span class="tag">
      ${s}
      <button class="tag-remove" data-index="${i}" title="Remove">×</button>
    </span>
  `).join("");
  container.querySelectorAll(".tag-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      profile.resume.skills.splice(parseInt(btn.dataset.index), 1);
      renderSkillTags();
    });
  });
}

function addSkill() {
  const input = document.getElementById("skill-input");
  const val = input.value.trim();
  if (!val) return;
  if (!profile.resume.skills.includes(val)) {
    profile.resume.skills.push(val);
    renderSkillTags();
  }
  input.value = "";
  input.focus();
}

// ─── Jobs tab ─────────────────────────────────────────────────────────────
function renderJobs() {
  const form = document.getElementById("form-body");
  form.innerHTML = `
    <div id="jobs-list"></div>
    <button id="add-job" class="btn-add-block">+ Add Position</button>
  `;
  renderJobCards();
  document.getElementById("add-job").addEventListener("click", () => {
    profile.resume.jobs.push({ employer: "", title: "", startDate: "", endDate: "", current: false, description: "" });
    renderJobCards();
  });
}

function renderJobCards() {
  const list = document.getElementById("jobs-list");
  if (!list) return;
  list.innerHTML = profile.resume.jobs.map((job, i) => `
    <div class="card" data-job="${i}">
      <div class="card-header">
        <span class="card-title">${job.employer || job.title || `Position ${i + 1}`}</span>
        ${i > 0 ? `<button class="btn-remove-card" data-job="${i}" title="Remove">×</button>` : ""}
      </div>
      ${jobFields(job, i)}
    </div>
  `).join("");

  list.querySelectorAll(".btn-remove-card").forEach(btn => {
    btn.addEventListener("click", () => {
      profile.resume.jobs.splice(parseInt(btn.dataset.job), 1);
      renderJobCards();
    });
  });
  list.querySelectorAll(".job-field").forEach(el => {
    el.addEventListener("input", () => {
      const i = parseInt(el.closest("[data-job]").dataset.job);
      const key = el.dataset.key;
      profile.resume.jobs[i][key] = el.type === "checkbox" ? el.checked : el.value;
      // Update card title live
      const titleEl = el.closest(".card")?.querySelector(".card-title");
      if (titleEl) {
        const j = profile.resume.jobs[i];
        titleEl.textContent = j.employer || j.title || `Position ${i + 1}`;
      }
    });
  });
}

function jobFields(job, i) {
  return `
    <div class="field-row"><label class="field-label">Employer</label>
      <input class="field-input job-field" data-key="employer" value="${job.employer || ""}" type="text" autocomplete="off" /></div>
    <div class="field-row"><label class="field-label">Job Title</label>
      <input class="field-input job-field" data-key="title" value="${job.title || ""}" type="text" autocomplete="off" /></div>
    <div class="field-row two-col">
      <div><label class="field-label">Start Date</label>
        <input class="field-input job-field" data-key="startDate" value="${job.startDate || ""}" type="month" /></div>
      <div><label class="field-label">End Date</label>
        <input class="field-input job-field" data-key="endDate" value="${job.endDate || ""}" type="month" ${job.current ? "disabled" : ""} /></div>
    </div>
    <div class="field-row check-row">
      <label class="check-label">
        <input type="checkbox" class="job-field" data-key="current" ${job.current ? "checked" : ""} />
        Currently working here
      </label>
    </div>
    <div class="field-row"><label class="field-label">Description</label>
      <textarea class="field-input job-field" data-key="description" rows="3">${job.description || ""}</textarea></div>
  `;
}

// ─── Education tab ────────────────────────────────────────────────────────
function renderEducation() {
  const form = document.getElementById("form-body");
  form.innerHTML = `
    <div id="edu-list"></div>
    <button id="add-edu" class="btn-add-block">+ Add Education</button>
  `;
  renderEduCards();
  document.getElementById("add-edu").addEventListener("click", () => {
    profile.resume.education.push({ school: "", degree: "", field: "", gradYear: "" });
    renderEduCards();
  });
}

function renderEduCards() {
  const list = document.getElementById("edu-list");
  if (!list) return;
  list.innerHTML = profile.resume.education.map((edu, i) => `
    <div class="card" data-edu="${i}">
      <div class="card-header">
        <span class="card-title">${edu.school || `Education ${i + 1}`}</span>
        ${i > 0 ? `<button class="btn-remove-card" data-edu="${i}" title="Remove">×</button>` : ""}
      </div>
      ${eduFields(edu, i)}
    </div>
  `).join("");

  list.querySelectorAll(".btn-remove-card").forEach(btn => {
    btn.addEventListener("click", () => {
      profile.resume.education.splice(parseInt(btn.dataset.edu), 1);
      renderEduCards();
    });
  });
  list.querySelectorAll(".edu-field").forEach(el => {
    el.addEventListener("input", () => {
      const i = parseInt(el.closest("[data-edu]").dataset.edu);
      profile.resume.education[i][el.dataset.key] = el.value;
      const titleEl = el.closest(".card")?.querySelector(".card-title");
      if (titleEl) titleEl.textContent = profile.resume.education[i].school || `Education ${i + 1}`;
    });
  });
}

function eduFields(edu, i) {
  return `
    <div class="field-row"><label class="field-label">School / University</label>
      <input class="field-input edu-field" data-key="school" value="${edu.school || ""}" type="text" autocomplete="off" /></div>
    <div class="field-row"><label class="field-label">Degree</label>
      <input class="field-input edu-field" data-key="degree" value="${edu.degree || ""}" type="text" autocomplete="off" /></div>
    <div class="field-row"><label class="field-label">Field of Study</label>
      <input class="field-input edu-field" data-key="field" value="${edu.field || ""}" type="text" autocomplete="off" /></div>
    <div class="field-row"><label class="field-label">Graduation Year</label>
      <input class="field-input edu-field" data-key="gradYear" value="${edu.gradYear || ""}" type="text" placeholder="2024" autocomplete="off" /></div>
  `;
}

// ─── Save current static section fields ───────────────────────────────────
function saveCurrentSection() {
  document.querySelectorAll(".static-field").forEach(el => {
    profile.resume[el.dataset.key] = el.value.trim();
  });
}

// ─── Storage ──────────────────────────────────────────────────────────────
function bindSaveButton() {
  document.getElementById("btn-save").addEventListener("click", async () => {
    saveCurrentSection();
    await chrome.storage.sync.set({ resumeProfile: profile });
    showToast("Saved ✓");
  });
}

function bindFillButton() {
  document.getElementById("btn-fill").addEventListener("click", async () => {
    saveCurrentSection();
    await chrome.storage.sync.set({ resumeProfile: profile });
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "fill", profile });
    showToast("Filling page ✓");
  });
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
