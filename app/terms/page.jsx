export default function TermsOfService() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 40px", fontFamily: "sans-serif", background: "#080808", minHeight: "100vh", color: "#F0EDE8" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, color: "#FF5C00" }}>Terms of Service</h1>
      <p style={{ color: "#555", fontSize: 13, marginBottom: 40 }}>Last updated: March 2026</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>1. Acceptance of Terms</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        By using n8nShip, you agree to these terms. If you do not agree, please do not use our service.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>2. Service Description</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        n8nShip provides a platform to deploy and manage n8n automation instances on Railway infrastructure. We handle the setup and deployment process on your behalf.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>3. Payment Terms</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        Pro plan is billed monthly at ₹999 (India) or $11 (International). Payments are processed securely via Razorpay. Subscriptions auto-renew unless cancelled.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>4. Acceptable Use</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        You agree not to use n8nShip for illegal activities, spamming, or any activity that violates Railway's terms of service. We reserve the right to terminate accounts that violate these terms.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>5. Limitation of Liability</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        n8nShip is provided "as is". We are not liable for any downtime, data loss, or damages arising from use of our service. Railway infrastructure uptime is subject to Railway's SLA.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>6. Contact</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        For any questions, contact us at: <a href="mailto:ashikshetty102@gmail.com" style={{ color: "#FF5C00" }}>ashikshetty102@gmail.com</a>
      </p>

      <a href="/" style={{ display: "inline-block", marginTop: 40, color: "#FF5C00", fontFamily: "monospace", fontSize: 13 }}>← Back to home</a>
    </div>
  );
}