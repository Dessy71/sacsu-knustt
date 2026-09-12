# SACSU KNUST · From Download to Live — Complete Setup Guide

Everything you do **after downloading this workspace**, in order:
unpack → develop & preview in VS Code → prepare the Google Sheet → set up n8n →
import & wire the workflow → test end-to-end → host on Vercel → post-launch chores.

> ⏱️ Realistic time: **~45–60 minutes** first run (most of it is Google/n8n OAuth clicks).
> Nothing here requires paid tools: n8n Cloud has a free tier, Vercel free tier is fine,
> VS Code is free.

---

## TL;DR checklist

- [ ] Unzip workspace, open `sacsu-registration/` in VS Code
- [ ] Run the site locally (demo mode) and play with the wizard
- [ ] Create/confirm the Google Sheet with the 10 headers
- [ ] Create an n8n account (Cloud) **or** run n8n locally
- [ ] Import `n8n/sacsu-registration-workflow.json`
- [ ] Attach Google Sheets + Gmail (`sacsuknust01@gmail.com`) credentials, set Sheet ID
- [ ] Test the workflow inside n8n, then **Activate** it
- [ ] Copy the **Production webhook URL** into `config.js`
- [ ] Submit a real test from the local site → row appears + email arrives
- [ ] Deploy to Vercel (`vercel --prod` or GitHub import)
- [ ] Post-deploy: fix `logoUrl`, canonical tags, CORS, run a production test

---

## Phase 0 · Unpack & install the tools

1. **Download & unzip** the workspace. You should see, at minimum:

   ```
   sacsu-registration/
   ├── index.html          # the futuristic wizard site
   ├── style.css           # dark-neon glass design system
   ├── app.js              # wizard engine + webhook submit + auto-capitalisation
   ├── config.js           # ⭐ your n8n webhook URL goes here
   ├── README.md           # short reference
   ├── DEPLOYMENT-GUIDE.md # ← you are here
   ├── assets/logo.png, assets/pre.png
   └── n8n/
       ├── sacsu-registration-workflow.json  # ⭐ import into n8n
       ├── email-template.html               # email source (@@tokens@@)
       ├── email-preview-sample.html         # filled sample email (browser preview)
       └── _build_workflow.py                # rebuilds workflow JSON after email edits
   ```

2. **Install** (skip what you already have):
   | Tool | Why | Get it |
   |---|---|---|
   | VS Code | editing + local server | code.visualstudio.com |
   | Node.js **18+** | n8n (if self-hosting) + Vercel CLI | nodejs.org LTS |
   | Git | pushing to GitHub (optional path) | git-scm.com |
   | Python 3 | only to rebuild the email/workflow after edits | python.org (usually preinstalled) |
   | Google account | Sheet owner + sender `sacsuknust01@gmail.com` | — |
   | n8n account | the automation engine | n8n.io (Cloud) or self-host (Phase 3) |
   | Vercel account | hosting the site | vercel.com |

---

## Phase 1 · First run in VS Code (no backend needed)

1. **VS Code → File → Open Folder…** → select `sacsu-registration/`.
2. Recommended extensions (left sidebar → Extensions):
   - **Live Server** (Ritwick Dey) — one-click local server with reload
   - **Prettier** — tidy formatting (optional)
3. Start the site:
   - Right-click `index.html` → **Open with Live Server**, *or*
   - Terminal (`` Ctrl+` ``): `python3 -m http.server 4173` → open `http://localhost:4173`
4. Because `config.js → WEBHOOK_URL` is still empty, the site runs in **demo mode**
   (gold banner under the buttons). Submissions animate, confetti, and succeed —
   but nothing leaves your machine. Perfect for design testing.
5. **Test the wizard behaviour:**
   - Every field is its own card; progress rail fills as you advance.
   - Type lowercase in Name/Programme/Zone/etc. → first letter auto-capitalises;
     after a **space, comma or hyphen** the next letter capitalises
     (`unity hall-on campus` → `Unity Hall-On Campus`).
   - Pick **Level 100** → an extra Residence card inserts itself; pick any other
     level and it disappears.
   - Last card = review with **EDIT** jumps; submit → success overlay + confetti.
6. **Safe places to customise:**
   | What | Where |
   |---|---|
   | Questions / hints / validators | `app.js` → `FIELDS` array |
   | Colours, radii, fonts | `style.css` → `:root` variables |
   | Header copy, footer, meta tags | `index.html` |
   | Webhook URL | `config.js` |
   | Email design & copy | `n8n/email-template.html` (see Phase 9) |

   ⚠️ Do **not** rename payload keys (`name`, `programme`, `academic-year`,
   `residence`, `contact`, `email`, `whatsApp`, `zone`, `branch`) — the sheet
   mapping and n8n Code node depend on them.

---

## Phase 2 · Prepare the Google Sheet

1. Open your existing SACSU registration sheet (the one the old Apps Script wrote to),
   or create a new Google Sheet named e.g. `SACSU Registrations 2025`.
2. Row 1 must contain **exactly** these headers (same names the old form used,
   plus `timestamp`):

   | name | programme | academic-year | residence | contact | email | whatsApp | zone | branch | timestamp |
   |---|---|---|---|---|---|---|---|---|---|

   - If reusing the old sheet: just **add a `timestamp` column** at the end if missing.
   - `academic-year` stores the raw level number (`1`…`6`) exactly like the old
     Apps Script did, so old and new rows stay consistent.
3. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`1AbC…xYz`**`/edit` → keep that middle part.
4. Make sure the Google account you'll use in n8n has **edit access** to this sheet.

---

## Phase 3 · Set up n8n (pick ONE home for it)

### Option A — n8n Cloud (recommended for production)
1. n8n.io → *Get started* → create workspace (free tier is enough).
2. Your instance lives at `https://<your-space>.app.n8n.cloud` — publicly reachable,
   HTTPS included, so webhooks work from anywhere immediately.

### Option B — n8n on your own machine (great for learning/testing)
```bash
# either:
npx n8n            # needs Node 18+
# or with Docker:
docker volume create n8n_data
docker run -it --rm --name n8n -p 5678:5678 \
  -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n
```
Open `http://localhost:5678`, create the owner account.
> ⚠️ A localhost n8n is **not reachable from a Vercel-hosted site**. For local
> end-to-end tests either run the site locally too, or expose n8n with
> `npx n8n tunnel`. For production, use Cloud (Option A) or a VPS (Option C).

### Option C — n8n on a VPS / Railway / Render
Deploy the official Docker image `docker.n8n.io/n8nio/n8n` behind HTTPS with a
domain (e.g. `n8n.sacsuknust.org`). Same UI as above; webhooks are public.

---

## Phase 4 · Import & configure the workflow (node by node)

1. n8n dashboard → **Workflows → ⋯ → Import from File** →
   choose `n8n/sacsu-registration-workflow.json`.
   You land on: `Webhook → Normalize & Personalise → Append to Google Sheets →
   Send Welcome Email → Respond Success` (+ a sticky note with this checklist).
2. **Webhook node** — nothing to change (path `sacsu-registration`, POST).
   Note the two URLs it shows:
   - *Test URL* `…/webhook-test/sacsu-registration` — works only while the editor
     is listening ("Listen for test event").
   - *Production URL* `…/webhook/sacsu-registration` — works once **Activated**.
3. **Normalize & Personalise (Code)** — works as-is. Optional: edit the two
   constants at the bottom of the code:
   - `logoUrl` → public URL of your logo (after Vercel deploy:
     `https://<your-domain>/assets/logo.png`; the default already points at
     `https://sacsu-form.vercel.app/assets/logo.png`)
   - `ctaLink` → your freshers WhatsApp circle link for the gold email button.
4. **Append to Google Sheets**
   - *Credential* → Create → **Sign in with Google** → pick the account that owns
     the sheet (grant access).
   - *Document* → mode **ID** → paste the Sheet ID from Phase 2.
   - *Sheet* → mode **Name** → your tab name (default `Sheet1`).
   - Columns are pre-mapped (`define below`) to the 10 headers — leave as-is.
5. **Send Welcome Email (Gmail)**
   - *Credential* → Create → **Sign in with Google** → sign in as
     **`sacsuknust01@gmail.com`** (this becomes the sender; reply-to is pre-set
     to the same address, sender name = “SACSU KNUST · Membership Desk”).
   - Recipient / subject / HTML body are pre-wired with expressions — don't edit
     unless customising.
   - *Self-hosted OAuth trouble?* If Google rejects the redirect, create a
     Google Cloud “OAuth client ID (Web)” and paste n8n's shown
     *OAuth Redirect URL* into its authorised redirects, then put Client ID/Secret
     into the credential.
6. **Respond Success** — nothing to change (returns `{"result":"success", …}`,
   the same contract your old Apps Script used).

---

## Phase 5 · Test the pipeline inside n8n

1. Click **Execute workflow / Listen for test event** on the Webhook node.
2. In a terminal:

   ```bash
   curl -X POST https://<your-n8n>/webhook-test/sacsu-registration \
     -H "Content-Type: application/json" \
     -d '{"name":"darko ama","programme":"bSc computer science","academic-year":"1",
          "residence":"unity hall-on campus","contact":"0241234567",
          "email":"YOU@st.knust.edu.gh","whatsApp":"0551234567",
          "zone":"zone 3, ayeduase","branch":"saviour chapel branch"}'
   ```
3. Watch each node turn green. Verify:
   - a new row lands in the sheet (values exactly as sent, raw level number),
   - an email arrives (check spam on first run) — cream newsletter, your JSON
     snapshot inside, logo + cross badge + scripture footer.
4. Fix anything red using the execution panel (the Code node's output shows every
   derived field: `firstName`, `levelLabel`, `jsonHtml`, …).
5. When green: flip the workflow **Active** toggle (top right).

---

## Phase 6 · Connect the site to n8n

1. In the Webhook node copy the **Production** URL
   (`https://<your-n8n>/webhook/sacsu-registration`).
2. Paste into `config.js`:

   ```js
   window.SACSU_CONFIG = {
     WEBHOOK_URL: "https://<your-n8n>/webhook/sacsu-registration",
   };
   ```
   The demo-mode banner disappears from the site.
3. With the local site running (Phase 1), submit a **real** entry end-to-end.
   Expect: success overlay + confetti, sheet row, personalised email.
4. Delete the test row from the sheet afterwards (or keep it labelled TEST).

---

## Phase 7 · Host on Vercel

### Path A — Vercel CLI (fastest, no Git)
```bash
npm i -g vercel
cd sacsu-registration          # folder that contains index.html
vercel login                   # email code
vercel                         # preview deployment → gives you a *.vercel.app URL
# test the preview URL fully (submit → sheet → email)
vercel --prod                  # production deployment
```
Tip: if you deploy into your **existing** `sacsu-form` Vercel project
(`vercel link` → pick it), your domain stays `sacsu-form.vercel.app` and the
default `logoUrl` in the Code node keeps working unchanged.

### Path B — GitHub → Vercel (auto-deploy on every push)
```bash
cd sacsu-registration
git init -b main
git add .
git commit -m "SACSU fresher registration portal + n8n pipeline"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/sacsu-registration.git
git push -u origin main
```
Then vercel.com → **Add New… → Project** → import the repo.
- *Framework Preset:* **Other** (pure static site, no build step)
- *Root Directory:* leave default if the repo root **is** `sacsu-registration`;
  set `sacsu-registration` if you pushed the whole workspace instead.
- Deploy. Every future `git push` redeploys automatically.

### Vercel settings you do NOT need
No env vars, no `vercel.json`, no functions — it's plain HTML/CSS/JS served as-is.

---

## Phase 8 · Post-deployment chores (5 minutes, don't skip)

1. **Production smoke test**: open the Vercel URL on your phone, submit a real
   registration, confirm sheet row + email. Delete/label the test row.
2. **Logo in emails**: in n8n → *Normalize & Personalise* → set `logoUrl` to
   `https://<your-vercel-domain>/assets/logo.png` (emails can't load local files).
   Skip if you kept `sacsu-form.vercel.app`.
3. **Meta tags**: if your domain changed, update `<link rel="canonical">` and the
   `og:*` tags in `index.html`, redeploy.
4. **CORS**: if the browser console ever shows a CORS error on submit, open the
   Webhook node → *Options* → *Allowed Origins* → add your Vercel domain (or `*`).
5. **Share**: put the link (or a QR code to it) in church announcements,
   WhatsApp circles and orientation slides. That's it — you're live. 

---

## Phase 9 · Day-to-day operations & updates

| Task | How |
|---|---|
| Monitor submissions | n8n → **Executions** tab (every run, status, error trace) |
| Watch for pipeline failures | n8n → Workflow Settings → error workflow / notifications |
| Redesign the welcome email | edit `n8n/email-template.html` → `python3 n8n/_build_workflow.py` → preview `email-preview-sample.html` in a browser → for **small copy tweaks** edit the HTML directly inside the Gmail node; for **big redesigns** re-import the rebuilt workflow JSON (then re-pick the 2 credentials + Sheet ID, ~1 min) |
| Add a new question | add it to `FIELDS` in `app.js` + a column header in the sheet + a mapping line in the Sheets node + (optionally) a row in the Code node's `rows` array so it appears in the email JSON snapshot |
| Backup registrations | Sheet → File → Download → Excel, monthly |
| Change sender identity | Gmail node options (`senderName`, `replyTo`) or switch the OAuth account |
| Swap Gmail for Brevo/SendGrid SMTP later (better bulk deliverability) | replace the Gmail node with an SMTP node; keep the same `message` HTML |

---

## Troubleshooting cheat-sheet

| Symptom | Fix |
|---|---|
| Site shows gold “Demo mode” banner | `config.js → WEBHOOK_URL` is empty |
| Submit spins then “Transmission failed” | workflow not **Active**, or you pasted the *test* URL instead of *production*, or n8n unreachable (localhost n8n + Vercel site = impossible without tunnel) |
| Browser console CORS error | Webhook node → Options → Allowed Origins |
| Row missing in sheet | header spelling mismatch (Phase 2 table) or wrong tab name in Sheets node |
| Email in spam | first-run normal; for bulk, move to Brevo/SendGrid SMTP (Phase 9) |
| No email at all | Gmail OAuth expired → re-connect credential; check n8n Executions for the failing node |
| Logo broken in email | `logoUrl` isn't a public `https://` URL |
| Auto-capitalisation “missing” a letter | it's by design: only field-start and after space/comma/hyphen; acronyms stay as typed |
| Re-imported workflow lost credentials | normal — re-pick Google Sheets + Gmail credentials and Sheet ID (they're stored account-wide, 3 clicks) |

---

*Questions or corrections while setting up? The union desk mail: saczuknust01@gmail.com · “Service in Unity” 🕊️*
