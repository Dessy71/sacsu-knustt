#!/usr/bin/env python3
"""
SACSU KNUST · build tool
------------------------
Compiles n8n/email-template.html (which contains @@tokens@@) into:
  1. n8n/sacsu-registration-workflow.json  -> importable n8n workflow
                                             (Webhook -> Code -> Google Sheets -> Gmail -> Respond)
  2. n8n/email-preview-sample.html         -> the same email filled with sample data,
                                             open in any browser to preview the design

Edit email-template.html, then re-run:  python3 n8n/_build_workflow.py
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, "email-template.html")
WORKFLOW = os.path.join(HERE, "sacsu-registration-workflow.json")
SAMPLE = os.path.join(HERE, "email-preview-sample.html")

# ---------------------------------------------------------------- sample data
SAMPLE_DATA = {
    "firstName": "Ama",
    "fullName": "Darko Ama",
    "programme": "BSc Computer Science",
    "levelLabel": "Level 100",
    "residenceDisplay": "Unity Hall · On Campus",
    "contact": "024 123 4567",
    "email": "ama.darko@st.knust.edu.gh",
    "whatsapp": "055 987 6543",
    "zone": "Zone 3 · Ayeduase",
    "branch": "Saviour Chapel Branch",
    "submittedAt": "Fri, 12 Sep 2025 · 14:05",
    "year": "2025",
    "logoUrl": "../assets/logo.png",
    "ctaLink": "https://chat.whatsapp.com/GYHwTReOs6X46Wjx49aNiU?mode=gi_t",
}

KEY_COLOR, PUNCT_COLOR, VAL_COLOR = "#F5C551", "#7FD1AE", "#F3EEE3"


def json_html(rows):
    """Colourised JSON block, email-client safe (inline-styled spans)."""
    out = ["{<br>"]
    for i, (k, v) in enumerate(rows):
        comma = "," if i < len(rows) - 1 else ""
        out.append(
            f'&nbsp;&nbsp;<span style="color:{KEY_COLOR}">"{k}"</span>'
            f'<span style="color:{PUNCT_COLOR}">: </span>'
            f'<span style="color:{VAL_COLOR}">"{v}"</span>{comma}<br>'
        )
    out.append("}")
    return "".join(out)


SAMPLE_JSON_HTML = json_html([
    ("full_name", SAMPLE_DATA["fullName"]),
    ("programme", SAMPLE_DATA["programme"]),
    ("level", SAMPLE_DATA["levelLabel"]),
    ("residence", SAMPLE_DATA["residenceDisplay"]),
    ("contact", SAMPLE_DATA["contact"]),
    ("email", SAMPLE_DATA["email"]),
    ("whatsapp", SAMPLE_DATA["whatsapp"]),
    ("scg_zone", SAMPLE_DATA["zone"]),
    ("scg_branch", SAMPLE_DATA["branch"]),
    ("logged_at", SAMPLE_DATA["submittedAt"]),
])

# ------------------------------------------------- n8n Code node (normaliser)
JS_CODE = r"""
const b = $input.first().json.body || $input.first().json;
const clean = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
const LEVELS = { '1': 'Level 100', '2': 'Level 200', '3': 'Level 300', '4': 'Level 400', '5': 'Level 500', '6': 'Level 600' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const name = clean(b.name);
const parts = name.split(' ').filter(Boolean);
const firstName = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || 'Friend');
const programme = clean(b.programme);
const academicYear = clean(b['academic-year']);
const levelLabel = LEVELS[academicYear] || ('Level ' + academicYear);
const residence = clean(b.residence);
const residenceDisplay = residence || '— (continuing student)';
const contact = clean(b.contact);
const email = clean(b.email).toLowerCase();
const whatsApp = clean(b.whatsApp || b.whatsapp);
const zone = clean(b.zone);
const branch = clean(b.branch);

const dt = DateTime.now().setZone('Africa/Accra');
const submittedAt = dt.toFormat('ccc, dd LLL yyyy · HH:mm');
const timestamp = dt.toISO();
const year = String(dt.year);

const logoUrl = 'https://sacsuknust-form.vercel.app/assets/logo.png'; // public URL of assets/logo.png on your deployed site
const ctaLink = 'https://chat.whatsapp.com/GYHwTReOs6X46Wjx49aNiU?mode=gi_t'; // freshers WhatsApp circle invite

const rows = [
  ['full_name', name],
  ['programme', programme],
  ['level', levelLabel],
  ['residence', residenceDisplay],
  ['contact', contact],
  ['email', email],
  ['whatsapp', whatsApp],
  ['scg_zone', zone],
  ['scg_branch', branch],
  ['logged_at', submittedAt]
];
let jsonHtml = '{<br>';
rows.forEach((r, i) => {
  jsonHtml += '&nbsp;&nbsp;<span style="color:#F5C551">"' + r[0] + '"</span><span style="color:#7FD1AE">: </span><span style="color:#F3EEE3">"' + esc(r[1]) + '"</span>' + (i < rows.length - 1 ? ',' : '') + '<br>';
});
jsonHtml += '}';

return [{ json: {
  name, programme, 'academic-year': academicYear, residence, contact, email, whatsApp,
  zone, branch, timestamp, firstName, fullName: name, levelLabel, residenceDisplay,
  submittedAt, year, logoUrl, ctaLink, jsonHtml
} }];
""".strip()

STICKY = """## SACSU KNUST · Fresher Registration pipeline

**Setup checklist**
1. **Credentials** — Google Sheets (OAuth2) on *Append to Google Sheets*, Gmail (OAuth2) on *Send Welcome Email*: sign in as the union account **sacsuknust01@gmail.com** (that address is the sender; reply-to is pre-set to it as well).
2. **Sheet** — in the Sheets node paste your Sheet ID (from the sheet URL) and tab name (default `Sheet1`).
   Header row must contain: `name, programme, academic-year, residence, contact, email, whatsApp, zone, branch, timestamp`.
3. **Branding** — in *Normalize & Personalise* update the `logoUrl` + `ctaLink` constants (hosted logo URL = your deployed site + `/assets/logo.png`).
4. **Go live** — Activate this workflow, copy the **Production** webhook URL into `config.js` on the website.
5. **Test** —
   `curl -X POST <WEBHOOK_URL> -H "Content-Type: application/json" -d "{\"name\":\"Darko Ama\",\"programme\":\"BSc CS\",\"academic-year\":\"1\",\"residence\":\"Unity Hall\",\"contact\":\"0241234567\",\"email\":\"you@st.knust.edu.gh\",\"whatsApp\":\"0551234567\",\"zone\":\"Zone 3\",\"branch\":\"Chapel Branch\"}"`
"""


def build():
    with open(TEMPLATE, encoding="utf-8") as fh:
        tpl = fh.read()

    # ---- 1. workflow variant: tokens -> n8n expressions
    html_expr = tpl.replace("@@JSONHTML@@", "{{ $json.jsonHtml }}")
    for tok in SAMPLE_DATA:
        html_expr = html_expr.replace(f"@@{tok}@@", f"{{{{ $json.{tok} }}}}")

    workflow = {
        "name": "SACSU KNUST — Fresher Registration (Webhook → Sheets → Gmail)",
        "nodes": [
            {
                "parameters": {"content": STICKY, "height": 460, "width": 420},
                "type": "n8n-nodes-base.stickyNote",
                "typeVersion": 1,
                "position": [-520, -180],
                "name": "Setup Guide",
            },
            {
                "parameters": {
                    "httpMethod": "POST",
                    "path": "sacsu-registration",
                    "responseMode": "responseNode",
                    "options": {},
                },
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 2,
                "position": [-40, 0],
                "name": "Webhook",
                "webhookId": "8f3b2c1a-5d4e-4a7f-9c2b-sacsuknust01",
            },
            {
                "parameters": {"mode": "runOnceForAllItems", "jsCode": JS_CODE},
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [180, 0],
                "name": "Normalize & Personalise",
            },
            {
                "parameters": {
                    "operation": "append",
                    "documentId": {"__rl": True, "value": "PASTE_YOUR_SHEET_ID", "mode": "id"},
                    "sheetName": {"__rl": True, "value": "Sheet1", "mode": "name"},
                    "columns": {
                        "mappingMode": "defineBelow",
                        "matchingColumns": [],
                        "value": {
                            "name": "={{ $json.name }}",
                            "programme": "={{ $json.programme }}",
                            "academic-year": "={{ $json['academic-year'] }}",
                            "residence": "={{ $json.residence }}",
                            "contact": "={{ $json.contact }}",
                            "email": "={{ $json.email }}",
                            "whatsApp": "={{ $json.whatsApp }}",
                            "zone": "={{ $json.zone }}",
                            "branch": "={{ $json.branch }}",
                            "timestamp": "={{ $json.timestamp }}",
                        },
                    },
                    "options": {},
                },
                "type": "n8n-nodes-base.googleSheets",
                "typeVersion": 4.5,
                "position": [400, 0],
                "name": "Append to Google Sheets",
            },
            {
                "parameters": {
                    "sendTo": "={{ $json.email }}",
                    "subject": "=🕊️ Welcome to the family, {{ $json.firstName }} — you're logged in!",
                    "emailType": "html",
                    "message": "=" + html_expr,
                    "options": {
                        "appendAttribution": False,
                        "senderName": "SACSU KNUST · Membership Desk",
                        "replyTo": "sacsuknust01@gmail.com",
                    },
                },
                "type": "n8n-nodes-base.gmail",
                "typeVersion": 2.1,
                "position": [620, 0],
                "name": "Send Welcome Email",
            },
            {
                "parameters": {
                    "respondWith": "json",
                    "responseBody": '{\n  "result": "success",\n  "message": "Logged into the SACSU database — welcome email dispatched."\n}',
                },
                "type": "n8n-nodes-base.respondToWebhook",
                "typeVersion": 1.1,
                "position": [840, 0],
                "name": "Respond Success",
            },
        ],
        "connections": {
            "Webhook": {"main": [[{"node": "Normalize & Personalise", "type": "main", "index": 0}]]},
            "Normalize & Personalise": {"main": [[{"node": "Append to Google Sheets", "type": "main", "index": 0}]]},
            "Append to Google Sheets": {"main": [[{"node": "Send Welcome Email", "type": "main", "index": 0}]]},
            "Send Welcome Email": {"main": [[{"node": "Respond Success", "type": "main", "index": 0}]]},
        },
        "settings": {"executionOrder": "v1"},
        "active": False,
        "pinData": {},
    }

    with open(WORKFLOW, "w", encoding="utf-8") as fh:
        json.dump(workflow, fh, indent=2, ensure_ascii=False)

    # ---- 2. sample preview variant: tokens -> sample values
    html_sample = tpl.replace("@@JSONHTML@@", SAMPLE_JSON_HTML)
    for tok, val in SAMPLE_DATA.items():
        html_sample = html_sample.replace(f"@@{tok}@@", val)
    with open(SAMPLE, "w", encoding="utf-8") as fh:
        fh.write(html_sample)

    # ---- sanity check
    with open(WORKFLOW, encoding="utf-8") as fh:
        json.load(fh)
    leftover = [t for t in SAMPLE_DATA if f"@@{t}@@" in html_sample] or (
        ["JSONHTML"] if "@@JSONHTML@@" in html_sample else []
    )
    print("workflow  ->", os.path.relpath(WORKFLOW, HERE))
    print("preview   ->", os.path.relpath(SAMPLE, HERE))
    print("unreplaced tokens:", leftover or "none")


if __name__ == "__main__":
    build()
