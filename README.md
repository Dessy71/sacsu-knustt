# SACSU KNUST · Fresher Registration — Dynamic Revamp + n8n Automation

> 📘 **First time here?** Follow [`DEPLOYMENT-GUIDE.md`](DEPLOYMENT-GUIDE.md) —
> the complete walk-through: download → VS Code development → Google Sheet →
> n8n setup → testing → Vercel hosting → post-launch ops.

Futuristic **dark-neon glass** registration portal for the Saviour Church Campus Group
Union (SACSU), KNUST — a multi-step wizard where **every input field is its own animated
card** — wired to an **n8n pipeline** that logs each submission to your **Google Sheet**
and fires a **personalised HTML newsletter-style welcome email** (Miro-reference design,
SACSU green & gold) to the fresher.

```
Form (this site) ──POST JSON──▶ n8n Webhook ──▶ Normalize & Personalise (Code)
                                    │
                                    ├──▶ Google Sheets (append row)
                                    ├──▶ Gmail (HTML welcome email)
                                    └──▶ Respond { result: "success" } ──▶ success UI + confetti
```

---

## 1 · Project structure (open this folder in VS Code)

```
sacsu-registration/
├── index.html                  # futuristic wizard UI (cards, HUD console, success overlay)
├── style.css                   # dark-neon glass design system + animations
├── app.js                      # wizard engine, validation, live JSON console, webhook submit
├── config.js                   # ⭐ paste your n8n production webhook URL here
├── DEPLOYMENT-GUIDE.md         # ⭐ full download-to-live walk-through
├── assets/
│   ├── logo.png                # SACSU KNUST lockup (header, preloader, favicon, email)
│   └── pre.png                 # legacy preloader mark (kept for reference)
└── n8n/
    ├── sacsu-registration-workflow.json   # ⭐ import this into n8n
    ├── email-template.html                # email source with @@tokens@@ (edit me)
    ├── email-preview-sample.html          # same email filled with sample data (open in browser)
    └── _build_workflow.py                 # rebuilds workflow JSON + sample after template edits
```

## 2 · Run the site locally (VS Code)

1. `File → Open Folder…` → select `sacsu-registration/`.
2. Recommended: install the **Live Server** extension → right-click `index.html` → *Open with Live Server*.
   (Or terminal: `python3 -m http.server 4173` and visit `http://localhost:4173`.)
3. With `config.js → WEBHOOK_URL` empty the site runs in **demo mode** (submissions succeed
   locally, nothing is sent) so you can preview everything before going live.

## 3 · Set up the n8n automation

### 3.1 Get an n8n instance (pick one)
| Option | How |
|---|---|
| **n8n Cloud** (easiest) | Sign up at `n8n.io` → your workspace URL is `https://<you>.app.n8n.cloud` |
| **Self-host (local)** | `npx n8n` or `docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n docker.n8n.io/n8nio/n8n` → `http://localhost:5678` |
| **Self-host (VPS)** | Deploy the official Docker image on Railway/Render/VPS behind HTTPS |

> Webhooks require a reachable URL: on Cloud/VPS you're fine; for local testing use
> `n8n tunnel` (`npx n8n tunnel`) or test directly inside the n8n editor.

### 3.2 Import the workflow
1. n8n → **Workflows → Import from File** → choose `n8n/sacsu-registration-workflow.json`.
2. You get 5 nodes + a sticky-note setup guide:
   `Webhook → Normalize & Personalise → Append to Google Sheets → Send Welcome Email → Respond Success`.

### 3.3 Credentials & sheet
1. **Google Sheets node** → create credential (OAuth2) with the Google account that owns the sheet.
   - `Document ID`: paste the ID from your sheet URL (`docs.google.com/spreadsheets/d/<THIS_PART>/edit`).
   - `Sheet Name`: your tab name (default `Sheet1`).
   - The header row must contain exactly:
     `name | programme | academic-year | residence | contact | email | whatsApp | zone | branch | timestamp`
     (same column names your old Apps Script used, plus `timestamp`).
2. **Gmail node** → create credential (OAuth2) with the union account **`sacsuknust01@gmail.com`** —
   that address becomes the sender. The node is pre-configured with
   `senderName: "SACSU KNUST · Membership Desk"` and `replyTo: saczuknust01@gmail.com`,
   sends **HTML**, and has n8n attribution disabled.
3. Optional branding: in the **Normalize & Personalise** Code node update the constants
   `logoUrl` (public URL of `assets/logo.png` — i.e. your deployed site + `/assets/logo.png`)
   and `ctaLink` (freshers WhatsApp circle link used by the gold email button).

### 3.4 Go live
1. **Activate** the workflow (toggle top-right).
2. Copy the **Production URL** from the Webhook node
   (`https://<your-n8n>/webhook/sacsu-registration`).
3. Paste it into `config.js` → `WEBHOOK_URL`. The demo-mode banner disappears.
4. Smoke-test from a terminal:

```bash
curl -X POST https://<your-n8n>/webhook/sacsu-registration \
  -H "Content-Type: application/json" \
  -d '{"name":"Darko Ama","programme":"BSc Computer Science","academic-year":"1",
       "residence":"Unity Hall","contact":"0241234567","email":"you@st.knust.edu.gh",
       "whatsApp":"0551234567","zone":"Zone 3","branch":"Chapel Branch"}'
# → {"result":"success", ...}  + row in sheet + email in inbox
```

## 4 · The welcome email

- Design follows your `email_ref` reference (cream canvas, big headline, white rounded
  card, pill CTA) re-coloured to **SACSU green `#1B5E20` / gold `#F5C551`**, logo in the
  header, cross badge, scripture footer — and the fresher's own submission rendered as a
  **colourised JSON snapshot** inside a dark code block.
- Preview anytime: open `n8n/email-preview-sample.html` in a browser.
- Edit the design in `n8n/email-template.html` (`@@firstName@@`, `@@jsonHtml@@`… are the
  personalisation tokens), then rebuild:

```bash
python3 n8n/_build_workflow.py     # regenerates workflow JSON + sample preview
```

then re-import the workflow JSON in n8n.

## 5 · Deploy the site (Vercel, same as before)

```bash
cd sacsu-registration
vercel deploy --prod        # or drag the folder into vercel.com/new
```

After deploying, update `logoUrl` in the Code node to `https://<your-domain>/assets/logo.png`
so the email header logo loads for every recipient, and update the `og:image`/canonical tags
in `index.html` if your domain changed.

## 6 · Behaviour parity with the old form

| Old static form | New portal |
|---|---|
| Table rows, plain submit | 9 glass cards + review card, wizard progress rail |
| Residence row appears for Level 100 | Residence card auto-inserts for Level 100 only |
| Raw typing, manual capitalisation | Smart auto title-case on all non-numeric text cards: first letter + the letter after every space / comma / hyphen is capitalised as you type (acronyms like KNUST or BSc stay intact); email & phone fields untouched |
| POST to Apps Script, `result: success` contract | POST JSON to n8n webhook, same `{result:"success"}` contract |
| Plain success `<h2>` | Success overlay with animated check + neon confetti + email notice |
| Confetti every 65 s | Confetti burst on successful registration (meaningful moment) |

## 7 · Troubleshooting

- **CORS error in browser console** → in the Webhook node's *Options*, set
  *Allowed Origins (CORS)* to your site domain (or `*`).
- **Email in spam** → send via a verified domain (Brevo/SendGrid SMTP can replace the Gmail
  node: swap node type, keep the same `message` HTML).
- **Row not appearing** → check sheet tab name + header spelling; the Sheets node maps by
  header name. `academic-year` stores the raw level number (`1`…`6`) exactly like the old
  Apps Script did; the human-readable `Level 100` label is used in the email.
- **Logo missing in email** → `logoUrl` must be a public `https://` URL (emails can't load
  local files).
- **Rebuild after template edits** → always re-run `_build_workflow.py` and re-import.

---

*“Service in Unity” — built for the SACSU KNUST membership desk. 🕊️*
