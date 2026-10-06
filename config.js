/* ============================================================
   SACSU KNUST · Fresher Registration — CONFIG
   ------------------------------------------------------------
   The site supports TWO free/automation backends. Fill in ONE:

   APPS_SCRIPT_URL  ⭐ recommended (100% free, never expires)
     The /exec URL of your Google Apps Script deployment
     (see apps-script/Code.gs header for the 5-step setup).
     Submissions are sent as text/plain so no CORS preflight is needed.

   WEBHOOK_URL      (optional — only if you return to n8n someday)
     The Production URL of your n8n Webhook node.

   With BOTH empty the site runs in DEMO MODE: submissions animate &
   succeed locally but nothing is sent (gold banner shown).
   ============================================================ */
window.SACSU_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxaedlXf_0nicpeL2EEg9hmmhLnwEIhXSteJHDFU7zvmk91fU-U41nPstKNkUe9bv1Q/exec",
  WEBHOOK_URL: "",     // e.g. "https://<your-n8n>/webhook/sacsu-registration"
};
