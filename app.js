/* ============================================================
   SACSU KNUST · Fresher Registration — wizard engine
   Multi-step glass cards · live JSON console · n8n webhook submit
   ============================================================ */
(function () {
  "use strict";

  const CFG = window.SACSU_CONFIG || { WEBHOOK_URL: "" };
  const WEBHOOK_URL = (CFG.WEBHOOK_URL || "").trim();

  /* ---------- field definitions (one card each) ---------- */
  const req = (msg) => (v) => (v.trim() ? "" : msg);
  const phone = (v) =>
    /^[+0-9][0-9\s-]{8,14}$/.test(v.trim()) ? "" : "Enter a valid mobile number, e.g. 024 123 4567.";
  const email = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "That email doesn't look right — check it once more.";

  const FIELDS = [
    {
      id: "name", key: "name", tag: "IDENTITY", type: "text",
      label: "Student's Name", ph: "Surname First Name",
      hint: "Exactly as it should appear in the SACSU roll book.",
      validate: (v) => (v.trim().length >= 3 ? "" : "Please enter the student's full name (surname first)."),
    },
    {
      id: "programme", key: "programme", tag: "ACADEMICS", type: "text",
      label: "Student's Programme", ph: "e.g. BSc Computer Science",
      hint: "The programme you are currently enrolled in at KNUST.",
      validate: (v) => (v.trim().length >= 2 ? "" : "Tell us your programme of study."),
    },
    {
      id: "academicYear", key: "academic-year", tag: "ACADEMICS", type: "pills",
      label: "Academic Year",
      hint: "Freshers are Level 100 — picking it unlocks the residence field.",
      options: [["1", "Level 100"], ["2", "Level 200"], ["3", "Level 300"], ["4", "Level 400"], ["5", "Level 500"], ["6", "Level 600"]],
      validate: (v) => (v ? "" : "Select your current level."),
    },
    {
      id: "residence", key: "residence", tag: "LOCATION", type: "text",
      label: "Place of Residence", ph: "e.g. Unity Hall / Evandy- Ayeduase",
      hint: "Hall / hostel and area. Level 100 only — we need to know where to find you.",
      when: (d) => d["academic-year"] === "1",
      validate: (v) => (v.trim().length >= 2 ? "" : "Where will we find you on campus?"),
    },
    {
      id: "contact", key: "contact", tag: "SIGNAL", type: "tel",
      label: "Contact", ph: "Active mobile number",
      hint: "Used only for urgent onboarding calls. We promise.",
      validate: phone,
    },
    {
      id: "email", key: "email", tag: "SIGNAL", type: "email",
      label: "Student's Email", ph: "name@gmail.com",
      hint: "Your personalised confirmation email lands here.",
      validate: email,
    },
    {
      id: "whatsapp", key: "whatsApp", tag: "SIGNAL", type: "tel",
      label: "WhatsApp Number", ph: "Active WhatsApp number",
      hint: "For onboarding groups, announcements & prayer chains.",
      validate: phone,
    },
    {
      id: "zone", key: "zone", tag: "CHURCH", type: "text",
      label: "SCG Zone", ph: "Which Saviour Church zone are you from?",
      hint: "e.g. Agogo/ Greater Accra",
      validate: req("Tell us your Saviour Church zone."),
    },
    {
      id: "branch", key: "branch", tag: "CHURCH", type: "text",
      label: "SCG Branch", ph: "Which Saviour Church branch are you from?",
      hint: "Your home branch within the zone. e.g. Adumasa, Bonwire.",
      validate: req("Tell us your Saviour Church branch."),
    },
  ];

  const TOTAL_KEYS = FIELDS.map((f) => f.key); // 9 payload keys

  /* ---------- state ---------- */
  const data = {};
  let index = 0;
  let submitting = false;

  const $ = (s) => document.querySelector(s);
  const cardWrap = $("#cardWrap");
  const rail = $("#rail");
  const backBtn = $("#backBtn");
  const nextBtn = $("#nextBtn");
  const liveJson = $("#liveJson");
  const captureCount = $("#captureCount");

  const getSteps = () => {
    const steps = FIELDS.filter((f) => !f.when || f.when(data));
    steps.push({ id: "review", type: "review" });
    return steps;
  };

  /* ---------- rendering ---------- */
  function renderRail(steps) {
    rail.innerHTML = steps.map((_, i) => `<i class="${i <= index ? "on" : ""}"></i>`).join("");
  }

  function fieldCard(f, steps) {
    const pos = `FIELD ${String(index + 1).padStart(2, "0")} / ${String(steps.length).padStart(2, "0")}`;
    let control = "";
    if (f.type === "pills") {
      control = `<div class="pills" role="radiogroup" aria-label="${f.label}">` +
        f.options.map(([val, lab]) =>
          `<button type="button" data-val="${val}" class="${data[f.key] === val ? "sel" : ""}" role="radio" aria-checked="${data[f.key] === val}">${lab}</button>`
        ).join("") + `</div>`;
    } else {
      control = `<div class="field">
          <input id="in-${f.id}" type="${f.type}" placeholder="${f.ph || " "}" autocomplete="off" value="${escAttr(data[f.key] || "")}">
          <label for="in-${f.id}">${f.ph || f.label}</label>
        </div>`;
    }
    return `<article class="step-card" data-step="${f.id}">
      <p class="step-tag">${pos} · ${f.tag}</p>
      <h2 class="step-label">${f.label}</h2>
      <p class="step-hint">${f.hint}</p>
      ${control}
      <p class="err" id="err"></p>
    </article>`;
  }

  function reviewCard(steps) {
    const rows = FIELDS.filter((f) => !f.when || f.when(data)).map((f) => {
      const val = f.type === "pills"
        ? (f.options.find(([v]) => v === data[f.key]) || [, "—"])[1]
        : (data[f.key] || "—");
      return `<div class="rev">
        <span class="k">${f.label}</span>
        <span class="v">${esc(val)}</span>
        <button type="button" data-goto="${f.id}">EDIT</button>
      </div>`;
    }).join("");
    return `<article class="step-card" data-step="review">
      <p class="step-tag">FINAL CHECK · TRANSMISSION</p>
      <h2 class="step-label">Lock it in?</h2>
      <p class="step-hint">One last look before your record beams into the SACSU database and your welcome email is dispatched.</p>
      <div class="rev-list">${rows}</div>
      <p class="err" id="err"></p>
    </article>`;
  }

  function render(dir) {
    const steps = getSteps();
    if (index > steps.length - 1) index = steps.length - 1;
    const step = steps[index];
    const html = step.type === "review" ? reviewCard(steps) : fieldCard(step, steps);

    const old = cardWrap.querySelector(".step-card");
    const swap = () => {
      cardWrap.innerHTML = html;
      bindStep(step);
      renderRail(steps);
      backBtn.disabled = index === 0;
      nextBtn.querySelector(".btn-label").textContent = step.type === "review" ? "Submit to SACSU KNUST" : "Next →";
      const input = cardWrap.querySelector("input");
      if (input) setTimeout(() => input.focus({ preventScroll: true }), 260);
    };
    if (old && dir) {
      old.classList.add("exit");
      setTimeout(swap, 220);
    } else {
      swap();
    }
  }

  function bindStep(step) {
    const card = cardWrap.querySelector(".step-card");

    // spotlight follows cursor
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });

    if (step.type === "review") {
      card.querySelectorAll("[data-goto]").forEach((b) =>
        b.addEventListener("click", () => {
          const steps = getSteps();
          index = steps.findIndex((s) => s.id === b.dataset.goto);
          render("back");
        })
      );
      return;
    }

    const input = card.querySelector("input");
    if (input) {
      input.addEventListener("input", () => {
        // smart title-case on every non-numeric text card (name, programme,
        // residence, zone, branch): first letter + letter after space / comma / hyphen
        if (step.type === "text") {
          const fixed = autoCap(input.value);
          if (fixed !== input.value) {
            const pos = input.selectionStart ?? fixed.length;
            input.value = fixed;
            input.setSelectionRange(pos, pos);
          }
        }
        data[step.key] = input.value;
        card.querySelector(".field").classList.remove("bad");
        setErr("");
        syncConsole();
      });
    }
    const pills = card.querySelector(".pills");
    if (pills) {
      pills.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-val]");
        if (!b) return;
        data[step.key] = b.dataset.val;
        pills.querySelectorAll("button").forEach((x) => {
          const on = x === b;
          x.classList.toggle("sel", on);
          x.setAttribute("aria-checked", on);
        });
        setErr("");
        syncConsole();
        setTimeout(() => goNext(true), 260); // auto-advance after picking a level
      });
    }
  }

  const setErr = (msg) => { const e = $("#err"); if (e) e.textContent = msg; };

  /* ---------- live JSON console ---------- */
  function syncConsole() {
    const obj = {};
    let n = 0;
    TOTAL_KEYS.forEach((k) => {
      if (data[k]) { obj[k] = data[k]; n++; }
    });
    liveJson.textContent = n ? JSON.stringify(obj, null, 2) : "{ }";
    captureCount.textContent = `${n}/9 CAPTURED`;
    liveJson.classList.add("flash");
    setTimeout(() => liveJson.classList.remove("flash"), 240);
  }

  /* ---------- navigation ---------- */
  function goNext(auto) {
    if (submitting) return;
    const steps = getSteps();
    const step = steps[index];

    if (step.type !== "review") {
      const msg = step.validate(data[step.key] || "");
      if (msg) {
        setErr(msg);
        const card = cardWrap.querySelector(".step-card");
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        const fld = card.querySelector(".field"); if (fld) fld.classList.add("bad");
        return;
      }
    }

    if (step.type === "review") { submit(); return; }

    index++;
    render("fwd");
  }

  function goBack() {
    if (index === 0 || submitting) return;
    index--;
    render("back");
  }

  /* ---------- submit → n8n webhook ---------- */
  async function submit() {
    submitting = true;
    nextBtn.classList.add("loading");
    nextBtn.disabled = true;
    backBtn.disabled = true;
    setErr("");

    const payload = {
      name: data.name || "",
      programme: data.programme || "",
      "academic-year": data["academic-year"] || "",
      residence: data["academic-year"] === "1" ? (data.residence || "") : "",
      contact: data.contact || "",
      email: (data.email || "").trim(),
      whatsApp: data.whatsApp || "",
      zone: data.zone || "",
      branch: data.branch || "",
    };

    try {
      let out = {};
      if (!WEBHOOK_URL) {
        await sleep(1400); // demo mode
      } else {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        out = await res.json().catch(() => ({}));
        if (out && out.result === "duplicate") { celebrateDuplicate(out); return; }
        if (out && out.result && out.result !== "success") throw new Error(out.error || "rejected");
      }
      celebrate(payload, out);
    } catch (err) {
      console.error("Submission failed:", err);
      setErr("Transmission failed — check your connection and hit submit again.");
      const card = cardWrap.querySelector(".step-card");
      card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
    } finally {
      submitting = false;
      nextBtn.classList.remove("loading");
      nextBtn.disabled = false;
      backBtn.disabled = false;
    }
  }

  /* ---------- success ---------- */
  function celebrate(payload, out) {
    const parts = payload.name.trim().split(/\s+/);
    const first = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || "Friend");
    $("#successTitle").textContent = `You're in, ${first}! 🎉`;
    $("#successText").innerHTML =
      `Your record has been logged into the <b>SACSU KNUST database</b>. A personalised welcome email with your digital member card is flying to <b>${esc(payload.email)}</b> right now — check your inbox (and spam, just in case).`;
    const idEl = $("#successId");
    if (out && out.memberId) {
      idEl.textContent = "MEMBER ID · " + out.memberId;
      idEl.hidden = false;
    } else {
      idEl.hidden = true;
    }
    $("#successOverlay").hidden = false;
    confetti(85);
  }

  function celebrateDuplicate(out) {
    document.querySelector(".success-card").classList.add("dup");
    $("#successTitle").textContent = "Already in the family! 🕊️";
    $("#successText").innerHTML =
      "These details are already logged in the <b>SACSU database</b> — no second record was created and no second email will be sent. Your original welcome email and digital member card are still waiting in your inbox (check spam too).";
    const idEl = $("#successId");
    if (out && out.memberId) {
      idEl.textContent = "MEMBER ID · " + out.memberId;
      idEl.hidden = false;
    } else {
      idEl.hidden = true;
    }
    $("#successOverlay").hidden = false; // no confetti: nothing new to celebrate
  }

  function confetti(n) {
    const box = $("#confetti");
    const colors = ["#3ddc84", "#7cffb2", "#f5c551", "#ffe08a", "#ffffff"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.setProperty("--s", 5 + Math.random() * 8 + "px");
      p.style.setProperty("--c", colors[(Math.random() * colors.length) | 0]);
      p.style.setProperty("--t", 2.4 + Math.random() * 2.2 + "s");
      p.style.setProperty("--dl", Math.random() * 0.5 + "s");
      p.style.setProperty("--x", (Math.random() * 160 - 80) + "px");
      p.style.setProperty("--rr", (Math.random() * 900 - 450) + "deg");
      box.appendChild(p);
      setTimeout(() => p.remove(), 5200);
    }
  }

  /* ---------- helpers ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /**
   * Auto title-case: capitalises the first letter of the field and the next
   * letter typed after a space, comma or hyphen. Everything else is left
   * exactly as typed (so acronyms like KNUST / BSc survive).
   */
  function autoCap(s) {
    let out = "";
    let cap = true; // start of field
    for (const ch of s) {
      if (cap && /[a-z]/.test(ch)) { out += ch.toUpperCase(); cap = false; }
      else { out += ch; cap = ch === " " || ch === "," || ch === "-"; }
    }
    return out;
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function escAttr(s) { return esc(s).replace(/"/g, "&quot;"); }

  /* ---------- ambience ---------- */
  function stars() {
    const box = $("#stars");
    for (let i = 0; i < 26; i++) {
      const s = document.createElement("span");
      const size = Math.random() < 0.8 ? 2 : 3;
      s.style.width = s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.setProperty("--d", 2.5 + Math.random() * 4 + "s");
      s.style.setProperty("--dl", Math.random() * 4 + "s");
      box.appendChild(s);
    }
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    stars();
    render();
    syncConsole();
    if (!WEBHOOK_URL) $("#demoNote").hidden = false;

    nextBtn.addEventListener("click", () => goNext());
    backBtn.addEventListener("click", goBack);
    $("#wizard").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "BUTTON") { e.preventDefault(); goNext(); }
    });

    $("#againBtn").addEventListener("click", () => {
      $("#successOverlay").hidden = true;
      document.querySelector(".success-card").classList.remove("dup");
      $("#successId").hidden = true;
      Object.keys(data).forEach((k) => delete data[k]);
      index = 0;
      render("back");
      syncConsole();
    });

    // preloader
    const kill = () => $("#preloader").classList.add("done");
    window.addEventListener("load", () => setTimeout(kill, 600));
    setTimeout(kill, 3000); // safety net
  });
})();
