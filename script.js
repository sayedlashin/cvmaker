// ====== State ======
const state = {
  experience: [],
  education: [],
  template: "classic"
};

// ====== Helpers ======
const $ = (id) => document.getElementById(id);
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

// ====== Dynamic lists (experience / education) ======
function renderDynList(kind) {
  const list = $(kind + "List");
  list.innerHTML = "";
  state[kind].forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "dyn-item";
    if (kind === "experience") {
      div.innerHTML = `
        <button class="btn btn-sm btn-danger remove" data-remove="${kind}" data-idx="${idx}">حذف</button>
        <div class="grid-2">
          <div class="field"><label>المسمى الوظيفي</label><input data-k="title" value="${esc(item.title)}" /></div>
          <div class="field"><label>الشركة</label><input data-k="company" value="${esc(item.company)}" /></div>
          <div class="field"><label>تاريخ البدء</label><input data-k="start" value="${esc(item.start)}" placeholder="01/2022" /></div>
          <div class="field"><label>تاريخ الانتهاء</label><input data-k="end" value="${esc(item.end)}" placeholder="حتى الآن" /></div>
        </div>
        <div class="field"><label>الوصف / المهام</label><textarea data-k="desc" rows="3">${esc(item.desc)}</textarea></div>
      `;
    } else {
      div.innerHTML = `
        <button class="btn btn-sm btn-danger remove" data-remove="${kind}" data-idx="${idx}">حذف</button>
        <div class="grid-2">
          <div class="field"><label>الشهادة / التخصص</label><input data-k="degree" value="${esc(item.degree)}" /></div>
          <div class="field"><label>الجامعة / المؤسسة</label><input data-k="school" value="${esc(item.school)}" /></div>
          <div class="field"><label>سنة التخرج</label><input data-k="year" value="${esc(item.year)}" /></div>
          <div class="field"><label>المعدل (اختياري)</label><input data-k="gpa" value="${esc(item.gpa)}" /></div>
        </div>
      `;
    }
    div.querySelectorAll("[data-k]").forEach(inp => {
      inp.addEventListener("input", e => {
        state[kind][idx][e.target.dataset.k] = e.target.value;
        renderPreview();
      });
    });
    list.appendChild(div);
  });
}

document.addEventListener("click", e => {
  const add = e.target.dataset.add;
  if (add === "experience") {
    state.experience.push({ title:"", company:"", start:"", end:"", desc:"" });
    renderDynList("experience"); renderPreview();
  }
  if (add === "education") {
    state.education.push({ degree:"", school:"", year:"", gpa:"" });
    renderDynList("education"); renderPreview();
  }
  const rm = e.target.dataset.remove;
  if (rm) {
    state[rm].splice(Number(e.target.dataset.idx), 1);
    renderDynList(rm); renderPreview();
  }
});

// ====== Preview ======
function collect() {
  return {
    fullName: $("fullName").value,
    jobTitle: $("jobTitle").value,
    email: $("email").value,
    phone: $("phone").value,
    location: $("location").value,
    linkedin: $("linkedin").value,
    summary: $("summary").value,
    skills: $("skills").value.split(",").map(s => s.trim()).filter(Boolean),
    languages: $("languages").value.split(",").map(s => s.trim()).filter(Boolean),
    experience: state.experience,
    education: state.education
  };
}

function renderPreview() {
  const d = collect();
  const contact = [d.email, d.phone, d.location, d.linkedin].filter(Boolean).map(esc).join(" • ");
  let html = `
    <h1 class="cv-name">${esc(d.fullName) || "اسمك الكامل"}</h1>
    <div class="cv-role">${esc(d.jobTitle) || "المسمى الوظيفي"}</div>
    <div class="cv-contact">${contact || "بيانات التواصل"}</div>
  `;
  if (d.summary) html += `<h2 class="cv-section">الملخص المهني</h2><p>${esc(d.summary)}</p>`;
  if (d.experience.length) {
    html += `<h2 class="cv-section">الخبرات العملية</h2>`;
    d.experience.forEach(x => {
      html += `<div class="cv-entry">
        <div class="cv-entry-head"><span>${esc(x.title)} — ${esc(x.company)}</span><span>${esc(x.start)} - ${esc(x.end)}</span></div>
        <p>${esc(x.desc)}</p></div>`;
    });
  }
  if (d.education.length) {
    html += `<h2 class="cv-section">المؤهلات العلمية</h2>`;
    d.education.forEach(x => {
      html += `<div class="cv-entry">
        <div class="cv-entry-head"><span>${esc(x.degree)}</span><span>${esc(x.year)}</span></div>
        <div class="cv-entry-sub">${esc(x.school)}${x.gpa ? " — المعدل: " + esc(x.gpa) : ""}</div>
      </div>`;
    });
  }
  if (d.skills.length) {
    html += `<h2 class="cv-section">المهارات</h2><ul class="cv-skills">${d.skills.map(s => `<li>${esc(s)}</li>`).join("")}</ul>`;
  }
  if (d.languages.length) {
    html += `<h2 class="cv-section">اللغات</h2><p>${d.languages.map(esc).join(" • ")}</p>`;
  }
  $("preview").innerHTML = html;
  $("preview").className = "cv-paper tpl-" + state.template;
}

document.querySelectorAll("input, textarea").forEach(el => {
  if (!el.dataset.k) el.addEventListener("input", renderPreview);
});

// Template selector
$("templateSelect").addEventListener("change", e => {
  state.template = e.target.value;
  renderPreview();
});

// ====== Word Export (ATS-friendly docx) ======
function buildDocxXml(d) {
  const tpl = state.template;
  const accent = tpl === "minimal" ? "000000" : "1E40AF";
  const p = (text, opts = {}) => {
    const { bold, size, color, heading, align } = opts;
    const rPr = `<w:rPr>${bold ? "<w:b/>" : ""}${size ? `<w:sz w:val="${size}"/>` : ""}${color ? `<w:color w:val="${color}"/>` : ""}</w:rPr>`;
    const pPr = `<w:pPr>${heading ? `<w:pStyle w:val="Heading${heading}"/>` : ""}${align ? `<w:jc w:val="${align}"/>` : ""}<w:bidi/></w:pPr>`;
    return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
  };
  const section = (title) => {
    if (tpl === "minimal") {
      return p(title.toUpperCase(), { bold: true, size: 24, color: "000000", heading: 2 });
    }
    return p(title, { bold: true, size: 28, color: accent, heading: 2 });
  };

  let body = "";
  const nameAlign = tpl === "minimal" ? "center" : undefined;
  body += p(d.fullName || "", { bold: true, size: tpl === "modern" ? 40 : 36, color: tpl === "modern" ? accent : "000000", align: nameAlign });
  if (d.jobTitle) body += p(d.jobTitle, { size: 24, color: tpl === "minimal" ? "333333" : accent, bold: tpl === "modern", align: nameAlign });
  const contact = [d.email, d.phone, d.location, d.linkedin].filter(Boolean).join(" | ");
  if (contact) body += p(contact, { size: 20, align: nameAlign });

  if (d.summary) { body += section("الملخص المهني"); body += p(d.summary, { size: 22 }); }

  if (d.experience.length) {
    body += section("الخبرات العملية");
    d.experience.forEach(x => {
      body += p(`${x.title} — ${x.company}`, { bold: true, size: 22 });
      body += p(`${x.start} - ${x.end}`, { size: 20, color: "555555" });
      if (x.desc) body += p(x.desc, { size: 22 });
    });
  }
  if (d.education.length) {
    body += section("المؤهلات العلمية");
    d.education.forEach(x => {
      body += p(`${x.degree} — ${x.school}`, { bold: true, size: 22 });
      body += p(`${x.year}${x.gpa ? " | المعدل: " + x.gpa : ""}`, { size: 20, color: "555555" });
    });
  }
  if (d.skills.length) { body += section("المهارات"); body += p(d.skills.join(" • "), { size: 22 }); }
  if (d.languages.length) { body += section("اللغات"); body += p(d.languages.join(" • "), { size: 22 }); }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/><w:bidi/></w:sectPr></w:body></w:document>`;
}

async function downloadDocx() {
  const d = collect();
  const zip = new JSZip();
  zip.file("[Content_Types].xml",
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.folder("_rels").file(".rels",
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.folder("word").file("document.xml", buildDocxXml(d));

  const blob = await zip.generateAsync({ type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(d.fullName || "CV").replace(/\s+/g,"_")}.docx`;
  a.click();
}

$("downloadBtn").addEventListener("click", downloadDocx);

// ====== Upload & Parse CV ======
$("uploadCv").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".json")) {
      const text = await file.text();
      applyData(JSON.parse(text));
    } else if (name.endsWith(".docx")) {
      const text = await extractDocxText(file);
      applyData(parseTextToData(text));
    } else {
      const text = await file.text();
      applyData(parseTextToData(text));
    }
    alert("تم استيراد البيانات بنجاح ✓");
  } catch (err) {
    console.error(err);
    alert("تعذر قراءة الملف: " + err.message);
  }
});

async function extractDocxText(file) {
  const zip = await JSZip.loadAsync(file);
  const xml = await zip.file("word/document.xml").async("string");
  // extract text inside <w:t> tags, paragraphs separated by newline
  const paragraphs = xml.split(/<\/w:p>/).map(p => {
    const matches = [...p.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
    return matches.map(m => m[1]).join("");
  });
  return paragraphs.join("\n").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"');
}

function parseTextToData(text) {
  const data = {};
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) data.email = emailMatch[0];
  const phoneMatch = text.match(/(\+?\d[\d\s\-()]{7,}\d)/);
  if (phoneMatch) data.phone = phoneMatch[0].trim();
  const linkedinMatch = text.match(/linkedin\.com\/[^\s]+/i);
  if (linkedinMatch) data.linkedin = linkedinMatch[0];

  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (lines.length) data.fullName = lines[0];
  if (lines.length > 1) data.jobTitle = lines[1];

  // sections
  const grab = (labels) => {
    const re = new RegExp(`(?:${labels.join("|")})[:：]?\\s*([\\s\\S]*?)(?=\\n(?:[A-Zا-ي][^\\n]{0,40}[:：])|$)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };
  data.summary = grab(["الملخص", "نبذة", "Summary", "Profile", "About"]);
  const skillsText = grab(["المهارات", "Skills"]);
  if (skillsText) data.skills = skillsText.split(/[,،•|\n]/).map(s => s.trim()).filter(Boolean).join(", ");
  const langText = grab(["اللغات", "Languages"]);
  if (langText) data.languages = langText.split(/[,،•|\n]/).map(s => s.trim()).filter(Boolean).join(", ");
  return data;
}

function applyData(d) {
  ["fullName","jobTitle","email","phone","location","linkedin","summary","skills","languages"].forEach(k => {
    if (d[k] != null && $(k)) $(k).value = Array.isArray(d[k]) ? d[k].join(", ") : d[k];
  });
  if (Array.isArray(d.experience)) { state.experience = d.experience; renderDynList("experience"); }
  if (Array.isArray(d.education)) { state.education = d.education; renderDynList("education"); }
  renderPreview();
}

// ====== Init ======
renderDynList("experience");
renderDynList("education");
renderPreview();