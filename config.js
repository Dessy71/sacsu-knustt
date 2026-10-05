/* ============================================================
   SACSU KNUST · Fresher Registration — CONFIG
   ------------------------------------------------------------
   WEBHOOK_URL
     The *production* URL of your n8n Webhook node.
     In n8n: open the workflow → Webhook node → copy the
     "Production" URL (looks like https://<your-n8n>/webhook/sacsu-registration)
     and paste it below between the quotes.

     While this is empty the site runs in DEMO MODE:
     submissions animate & succeed locally but nothing is sent

     window.SACSU_CONFIG = {
  WEBHOOK_URL: "https://sacsuknust.app.n8n.cloud/webhook/sacsu-registration", 
};
   ============================================================ */
window.SACSU_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwBBOyJMPOXxaNLCoybwkMLiiyG_MmQ8b088PMoleR3xPnzLnO8IP5d8ruz8YkI8hLQcA/exec", 
};


