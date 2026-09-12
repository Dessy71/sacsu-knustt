/* ============================================================
   SACSU KNUST · Fresher Registration — CONFIG
   ------------------------------------------------------------
   WEBHOOK_URL
     The *production* URL of your n8n Webhook node.
     In n8n: open the workflow → Webhook node → copy the
     "Production" URL (looks like https://<your-n8n>/webhook/sacsu-registration)
     and paste it below between the quotes.

     While this is empty the site runs in DEMO MODE:
     submissions animate & succeed locally but nothing is sent.
   ============================================================ */
window.SACSU_CONFIG = {
  WEBHOOK_URL: "https://sacsuknust.app.n8n.cloud/webhook/sacsu-registration", 
};
