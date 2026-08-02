// Vercel serverless function: /api/token
// Runs server-side. Handles the Deriv OAuth "exchange code for token" step,
// which Deriv's docs require to happen off the browser.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { code, code_verifier, redirect_uri } = req.body || {};

  if (!code || !code_verifier || !redirect_uri) {
    res.status(400).json({ error: "missing_params", detail: "code, code_verifier, and redirect_uri are all required" });
    return;
  }

  const APP_ID = "340jQNXrItGcDvwd5kjEU"; // your Deriv OAuth2 client_id

  try {
    const derivRes = await fetch("https://auth.deriv.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: APP_ID,
        code,
        code_verifier,
        redirect_uri,
      }),
    });

    const data = await derivRes.json();

    if (!derivRes.ok) {
      res.status(derivRes.status).json({ error: data.error || "token_exchange_failed", detail: data });
      return;
    }

    // Only pass back what the browser needs — never log or store the code itself
    res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  } catch (err) {
    res.status(500).json({ error: "server_error", detail: err.message });
  }
}
