export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 40px", fontFamily: "sans-serif", background: "#080808", minHeight: "100vh", color: "#F0EDE8" }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, color: "#FF5C00" }}>Privacy Policy</h1>
      <p style={{ color: "#555", fontSize: 13, marginBottom: 40 }}>Last updated: March 2026</p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>1. Information We Collect</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        We collect your email address when you sign up or make a payment. We also collect payment information processed securely through Razorpay. We do not store your payment card details.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>2. How We Use Your Information</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        We use your email to send you your n8n instance credentials, important service updates, and billing information. We do not sell or share your personal information with third parties.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>3. Data Storage</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        Your data is stored securely in Supabase (hosted on AWS). Payment records are stored for accounting purposes. You can request deletion of your data by contacting us.
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>4. Third Party Services</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        We use the following third-party services: Razorpay (payments), Railway (n8n hosting), Resend (emails), Vercel (website hosting), and Upstash (rate limiting).
      </p>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, marginTop: 32 }}>5. Contact Us</h2>
      <p style={{ color: "#888", lineHeight: 1.8, marginBottom: 16 }}>
        For any privacy concerns, contact us at: <a href="mailto:ashikshetty102@gmail.com" style={{ color: "#FF5C00" }}>ashikshetty102@gmail.com</a>
      </p>

      <a href="/" style={{ display: "inline-block", marginTop: 40, color: "#FF5C00", fontFamily: "monospace", fontSize: 13 }}>← Back to home</a>
    </div>
  );
}