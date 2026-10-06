/* ============================================================
   SACSU KNUST · /api/submit — Vercel serverless proxy
   ------------------------------------------------------------
   WHY THIS EXISTS:
   iOS Safari's tracking prevention refuses to follow Apps Script's
   cross-site 302 redirect (script.google.com → script.googleusercontent.com),
   so Safari users saw "transmission failed" even though their row WAS logged
   and the welcome email WAS sent. This proxy keeps the browser on the SAME
   ORIGIN (sacsuknust-form.vercel.app/api/submit) and follows Google's
   redirect server-side, where no browser policy applies.

   KEEP IN SYNC: this URL must match APPS_SCRIPT_URL in config.js.
   ============================================================ */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxaedlXf_0nicpeL2EEg9hmmhLnwEIhXSteJHDFU7zvmk91fU-U41nPstKNkUe9bv1Q/exec";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(200).json({ result: "info", message: "SACSU submit proxy — POST only." });
  }

  try {
    // Vercel body-parses JSON; text/plain arrives as a string. Forward either as text/plain.
    const raw =
      typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body && Object.keys(req.body).length ? req.body : {});

    const upstream = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow", // server-side: Safari's redirect blocking never applies here
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: raw,
    });

    const text = await upstream.text();
    let out;
    try {
      out = JSON.parse(text);
    } catch (_) {
      out = { result: "error", message: "Upstream returned a non-JSON response (HTTP " + upstream.status + ")." };
    }
    return res.status(200).json(out);
  } catch (err) {
    return res.status(200).json({ result: "error", message: String((err && err.message) || err) });
  }
};

// Allow slow Apps Script cold starts (Hobby default of 10s can be tight)
module.exports.config = { maxDuration: 30 };
