"use client";
import React, { useState, useEffect } from "react";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080808", color: "#F0EDE8" }}>
          <h1 style={{ color: "#FF5C00" }}>Something went wrong 😕</h1>
          <p style={{ color: "#888" }}>Please refresh the page or contact support.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#FF5C00", color: "#000", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", marginTop: "16px" }}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Geo-based pricing
const PRICES = {
  IN: { currency: "INR", symbol: "₹", amount: 999, display: "999" },
  DEFAULT: { currency: "USD", symbol: "$", amount: 11, display: "11" },
};

export default function N8nDeploy() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", instance: "" });
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [deployUrl, setDeployUrl] = useState("");
  const [ticker, setTicker] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [price, setPrice] = useState(PRICES.DEFAULT);
  const [trialDaysLeft, setTrialDaysLeft] = useState(3);
  const heroRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTicker(p => (p + 1) % 100), 40);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Detect country and set price
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        if (data.country_code === "IN") {
          setPrice(PRICES.IN);
        } else {
          setPrice(PRICES.DEFAULT);
        }
      })
      .catch(() => setPrice(PRICES.DEFAULT));
  }, []);

  const openWizard = (selectedPlan) => {
    setPlan(selectedPlan);
    setStep(selectedPlan ? 2 : 1);
    setWizardOpen(true);
    setDeployed(false);
    setDeploying(false);
  };

  const handleDeploy = async () => {
    if (!form.email || !form.instance) return;

    if (plan === "pro") {
      setDeploying(true);
      try {
        // Step 1: Create Razorpay order
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, currency: price.currency }),
        });
        const data = await res.json();

        // Step 2: Open Razorpay payment modal
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "n8nShip",
          description: "n8nShip Pro - Monthly",
          order_id: data.orderId,
          handler: async function (response) {
            // Step 3: Verify payment + deploy n8n
            const verifyRes = await fetch("/api/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: form.email,
                currency: price.currency,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setDeployUrl(verifyData.deploymentUrl);
              setDeploying(false);
              setDeployed(true);
            }
          },
          prefill: { email: form.email },
          theme: { color: "#FF5C00" },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setDeploying(false);
      } catch (err) {
        console.error(err);
        setDeploying(false);
        alert("Payment failed. Please try again.");
      }
      return;
    }

    // Free plan deploy
    setDeploying(true);
    await new Promise(r => setTimeout(r, 3000));
    setDeployUrl(`https://${form.instance.toLowerCase().replace(/\s+/g, "-")}.up.railway.app`);
    setDeploying(false);
    setDeployed(true);
  };

  const steps_meta = [
    { n: "01", label: "Pick Plan" },
    { n: "02", label: "Configure" },
    { n: "03", label: "Deploy" },
  ];

  return (
    <ErrorBoundary>
    <>
      <script src="https://checkout.razorpay.com/v1/checkout.js" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

        :root {
          --bg: #080808;
          --surface: #101010;
          --border: rgba(255,255,255,0.07);
          --orange: #FF5C00;
          --orange-dim: rgba(255,92,0,0.12);
          --text: #F0EDE8;
          --muted: #555050;
          --card: #111111;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; overflow-x: hidden; }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 0 40px;
          display: flex; align-items: center; justify-content: space-between;
          height: 60px;
          transition: all 0.3s;
        }
        .nav.scrolled {
          background: rgba(8,8,8,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          font-size: 18px; font-weight: 800; letter-spacing: -0.02em;
          display: flex; align-items: center; gap: 8px;
        }
        .nav-logo span { color: var(--orange); }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-links a {
          color: var(--muted); font-size: 13px; text-decoration: none;
          font-family: 'JetBrains Mono', monospace; letter-spacing: 0.05em;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--text); }
        .btn-nav {
          padding: 8px 20px; background: var(--orange); color: #000;
          border: none; border-radius: 6px; font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-nav:hover { background: #ff7a33; transform: translateY(-1px); }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 100px 20px 60px;
          position: relative; overflow: hidden;
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
        }
        .hero-glow {
          position: absolute; width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(255,92,0,0.15) 0%, transparent 70%);
          top: 30%; left: 50%; transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          border: 1px solid rgba(255,92,0,0.3);
          background: rgba(255,92,0,0.08);
          border-radius: 100px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--orange);
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 28px;
          position: relative; z-index: 1;
          animation: fadeDown 0.6s ease forwards;
        }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--orange); animation: blink 1.5s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .hero h1 {
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 800; line-height: 1.0;
          letter-spacing: -0.04em;
          position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        .hero h1 em { font-style: normal; color: var(--orange); }
        .hero-sub {
          font-size: clamp(15px, 2vw, 18px);
          color: var(--muted); max-width: 520px;
          line-height: 1.6; margin: 20px auto 0;
          font-family: 'JetBrains Mono', monospace; font-weight: 300;
          position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.2s ease both;
        }
        .hero-ctas {
          display: flex; gap: 12px; align-items: center;
          justify-content: center; margin-top: 40px;
          position: relative; z-index: 1;
          animation: fadeUp 0.7s 0.3s ease both;
        }
        .btn-primary {
          padding: 14px 32px; background: var(--orange);
          color: #000; border: none; border-radius: 8px;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { background: #ff7a33; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,92,0,0.3); }
        .btn-secondary {
          padding: 14px 28px; background: transparent;
          color: var(--muted); border: 1px solid var(--border);
          border-radius: 8px; font-family: 'JetBrains Mono', monospace;
          font-size: 13px; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }

        /* STATS */
        .stats-bar {
          display: flex; justify-content: center; gap: 60px;
          padding: 40px 20px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          animation: fadeUp 0.7s 0.4s ease both;
        }
        .stat { text-align: center; }
        .stat-num {
          font-size: 32px; font-weight: 800; letter-spacing: -0.03em;
          color: var(--text);
        }
        .stat-num span { color: var(--orange); }
        .stat-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--muted);
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-top: 4px;
        }

        /* PROBLEM/SOLUTION */
        .section { padding: 100px 40px; max-width: 1100px; margin: 0 auto; }
        .section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--orange);
          letter-spacing: 0.15em; text-transform: uppercase;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800; letter-spacing: -0.03em;
          line-height: 1.1; margin-bottom: 24px;
        }

        .compare-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
          margin-top: 48px;
        }
        .compare-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 32px;
        }
        .compare-card.bad { border-color: rgba(255,80,80,0.2); }
        .compare-card.good { border-color: rgba(255,92,0,0.3); background: rgba(255,92,0,0.04); }
        .compare-head {
          font-size: 12px; font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.1em; text-transform: uppercase;
          margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
        }
        .compare-head.bad { color: #ff5555; }
        .compare-head.good { color: var(--orange); }
        .step-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13.5px; color: #888;
          font-family: 'JetBrains Mono', monospace; font-weight: 300;
        }
        .step-item:last-child { border-bottom: none; }
        .step-item.done { color: var(--text); }
        .step-num {
          width: 22px; height: 22px; border-radius: 4px;
          background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: #ff5555; flex-shrink: 0;
          font-family: 'JetBrains Mono', monospace;
        }
        .step-num.done {
          background: var(--orange-dim); border-color: rgba(255,92,0,0.3);
          color: var(--orange);
        }
        .time-badge {
          display: inline-block; margin-top: 20px;
          padding: 4px 12px; border-radius: 100px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
        }
        .time-badge.slow { background: rgba(255,80,80,0.1); color: #ff5555; }
        .time-badge.fast { background: var(--orange-dim); color: var(--orange); }

        /* HOW IT WORKS */
        .how-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;
          margin-top: 48px; background: var(--border);
          border-radius: 16px; overflow: hidden;
          border: 1px solid var(--border);
        }
        .how-card {
          background: var(--card); padding: 36px 28px;
          position: relative; overflow: hidden;
          transition: background 0.2s;
        }
        .how-card:hover { background: #161616; }
        .how-num {
          font-size: 64px; font-weight: 800;
          color: rgba(255,255,255,0.04);
          line-height: 1; margin-bottom: 20px;
          letter-spacing: -0.04em;
        }
        .how-icon {
          width: 42px; height: 42px; border-radius: 10px;
          background: var(--orange-dim); border: 1px solid rgba(255,92,0,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; margin-bottom: 16px;
        }
        .how-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
        .how-body { font-size: 13px; color: var(--muted); line-height: 1.6; font-family: 'JetBrains Mono', monospace; font-weight: 300; }

        /* PRICING */
        .pricing-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 20px; margin-top: 48px; max-width: 700px; margin-left: auto; margin-right: auto;
        }
        .price-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 32px;
          position: relative; transition: transform 0.2s, border-color 0.2s;
        }
        .price-card:hover { transform: translateY(-4px); }
        .price-card.pro {
          border-color: rgba(255,92,0,0.4);
          background: linear-gradient(135deg, rgba(255,92,0,0.06) 0%, var(--card) 60%);
        }
        .price-card.pro::before {
          content: 'POPULAR';
          position: absolute; top: -1px; right: 24px;
          background: var(--orange); color: #000;
          font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
          padding: 4px 10px; border-radius: 0 0 8px 8px;
          font-family: 'JetBrains Mono', monospace;
        }
        .price-name { font-size: 12px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; color: var(--muted); text-transform: uppercase; margin-bottom: 12px; }
        .price-amount { font-size: 42px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
        .price-amount span { font-size: 16px; color: var(--muted); font-weight: 400; }
        .price-desc { font-size: 13px; color: var(--muted); margin: 12px 0 24px; font-family: 'JetBrains Mono', monospace; font-weight: 300; line-height: 1.5; }
        .price-features { list-style: none; }
        .price-features li {
          font-size: 13px; padding: 8px 0;
          border-bottom: 1px solid var(--border);
          display: flex; gap: 10px; align-items: center;
          font-family: 'JetBrains Mono', monospace; font-weight: 300;
          color: #aaa;
        }
        .price-features li:last-child { border-bottom: none; }
        .check { color: var(--orange); font-size: 14px; flex-shrink: 0; }
        .price-btn {
          width: 100%; margin-top: 24px; padding: 13px;
          border-radius: 8px; font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; border: none;
        }
        .price-btn.free { background: rgba(255,255,255,0.07); color: var(--text); }
        .price-btn.free:hover { background: rgba(255,255,255,0.12); }
        .price-btn.pro { background: var(--orange); color: #000; }
        .price-btn.pro:hover { background: #ff7a33; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,92,0,0.25); }

        /* TERMINAL */
        .terminal {
          background: #0a0a0a; border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden; max-width: 560px; margin: 48px auto 0;
        }
        .terminal-bar {
          background: #141414; padding: 10px 16px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        .t-dot { width: 10px; height: 10px; border-radius: 50%; }
        .terminal-body { padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.8; }
        .t-line { display: flex; gap: 10px; }
        .t-prompt { color: var(--orange); }
        .t-cmd { color: #e0e0e0; }
        .t-comment { color: var(--muted); }
        .t-success { color: #4ade80; }

        /* WIZARD */
        .overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        .wizard {
          background: #0f0f0f;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px; padding: 0;
          width: 100%; max-width: 520px;
          overflow: hidden;
          animation: wizardIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes wizardIn { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .wizard-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .wizard-title { font-size: 16px; font-weight: 700; }
        .wizard-steps {
          display: flex; gap: 0; font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }
        .wstep {
          padding: 4px 12px; color: var(--muted);
          border-right: 1px solid var(--border);
          display: flex; align-items: center; gap: 6px;
        }
        .wstep:last-child { border-right: none; }
        .wstep.active { color: var(--orange); }
        .wstep.done { color: #4ade80; }
        .close-btn {
          width: 30px; height: 30px; border-radius: 6px;
          background: rgba(255,255,255,0.05); border: none;
          color: var(--muted); cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .close-btn:hover { background: rgba(255,255,255,0.1); color: var(--text); }
        .wizard-body { padding: 28px; }
        .wizard-label {
          font-size: 11px; font-family: 'JetBrains Mono', monospace;
          color: var(--muted); letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 6px; display: block;
        }
        .wizard-input {
          width: 100%; padding: 12px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border); border-radius: 8px;
          color: var(--text); font-family: 'JetBrains Mono', monospace;
          font-size: 13.5px; outline: none; margin-bottom: 16px;
          transition: border-color 0.2s;
        }
        .wizard-input:focus { border-color: rgba(255,92,0,0.4); }
        .wizard-input::placeholder { color: var(--muted); }
        .plan-select { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .plan-opt {
          padding: 18px; border-radius: 10px;
          border: 1.5px solid var(--border);
          cursor: pointer; transition: all 0.15s;
          background: rgba(255,255,255,0.02);
        }
        .plan-opt:hover { border-color: rgba(255,92,0,0.3); background: rgba(255,92,0,0.04); }
        .plan-opt.selected { border-color: var(--orange); background: rgba(255,92,0,0.08); }
        .plan-opt-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .plan-opt-price {
          font-size: 12px; font-family: 'JetBrains Mono', monospace;
          color: var(--muted); margin-bottom: 10px;
        }
        .plan-opt-feat { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; line-height: 1.6; }
        .wizard-footer {
          padding: 16px 28px;
          border-top: 1px solid var(--border);
          display: flex; gap: 10px; justify-content: flex-end;
        }
        .btn-wiz-back {
          padding: 10px 20px; background: transparent;
          border: 1px solid var(--border); border-radius: 7px;
          color: var(--muted); font-family: 'JetBrains Mono', monospace;
          font-size: 12px; cursor: pointer; transition: all 0.15s;
        }
        .btn-wiz-back:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }
        .btn-wiz-next {
          padding: 10px 24px; background: var(--orange);
          border: none; border-radius: 7px; color: #000;
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-wiz-next:hover { background: #ff7a33; }
        .btn-wiz-next:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Deploy animation */
        .deploy-anim {
          display: flex; flex-direction: column;
          align-items: center; padding: 32px 20px;
          text-align: center; gap: 16px;
        }
        .spinner {
          width: 52px; height: 52px; border-radius: 50%;
          border: 3px solid var(--border);
          border-top-color: var(--orange);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .deploy-log {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--muted);
          background: rgba(255,255,255,0.03);
          border-radius: 8px; padding: 14px 18px;
          width: 100%; text-align: left; line-height: 2;
        }
        .log-item { display: flex; gap: 8px; }
        .log-item .t-success { color: #4ade80; }
        .log-item .t-comment { color: var(--muted); }

        /* Success */
        .success-card {
          text-align: center; padding: 16px 8px 28px;
        }
        .success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(74,222,128,0.1);
          border: 2px solid rgba(74,222,128,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }
        .success-title { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
        .success-url {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px;
          background: rgba(255,92,0,0.08); border: 1px solid rgba(255,92,0,0.25);
          border-radius: 8px; font-family: 'JetBrains Mono', monospace;
          font-size: 13px; color: var(--orange); margin: 16px 0 24px;
          cursor: pointer; word-break: break-all;
        }

        /* Security badge */
        .security-row {
          display: flex; justify-content: center; gap: 32px;
          padding: 40px 20px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .sec-badge {
          display: flex; align-items: center; gap: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px; color: var(--muted);
          letter-spacing: 0.05em;
        }
        .sec-badge span { font-size: 16px; }

        /* FOOTER */
        footer {
          border-top: 1px solid var(--border);
          padding: 40px;
          display: flex; align-items: center; justify-content: space-between;
          max-width: 1100px; margin: 0 auto;
        }
        .footer-logo { font-size: 15px; font-weight: 800; }
        .footer-logo span { color: var(--orange); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a {
          font-size: 12px; color: var(--muted); text-decoration: none;
          font-family: 'JetBrains Mono', monospace;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--text); }

        @media (max-width: 700px) {
          .compare-grid, .how-grid, .pricing-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .stats-bar { gap: 30px; flex-wrap: wrap; }
          footer { flex-direction: column; gap: 20px; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-logo">n8n<span>Ship</span></div>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#security">Security</a>
        </div>
        <button className="btn-nav" onClick={() => openWizard(null)}>Deploy Now →</button>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="badge"><div className="badge-dot" /> Live · Deploy n8n in under 60 seconds</div>
        <h1>
          Your own n8n,<br />
          <em>running in 60s.</em>
        </h1>
        <p className="hero-sub">
          Stop spending 30 minutes on servers, SSH, Docker & configs.<br />
          Pick a plan. Click deploy. Done.
        </p>
        <div className="hero-ctas">
          <button className="btn-primary" onClick={() => openWizard("free")}>
            Deploy for Free →
          </button>
          <button className="btn-secondary" onClick={() => { document.getElementById("how").scrollIntoView({ behavior: "smooth" }); }}>
            See how it works
          </button>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        <div className="stat">
          <div className="stat-num">30<span>min</span></div>
          <div className="stat-label">Traditional setup</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: "var(--orange)" }}>60<span>sec</span></div>
          <div className="stat-label">With n8nShip</div>
        </div>
        <div className="stat">
          <div className="stat-num">7<span>steps</span></div>
          <div className="stat-label">Eliminated</div>
        </div>
        <div className="stat">
          <div className="stat-num">$0</div>
          <div className="stat-label">To start</div>
        </div>
      </div>

      {/* PROBLEM / SOLUTION */}
      <div className="section">
        <div className="section-label">// The problem</div>
        <div className="section-title">
          Setting up n8n is<br />painful. We fixed it.
        </div>
        <div className="compare-grid">
          <div className="compare-card bad">
            <div className="compare-head bad">✗ The old way</div>
            {["Buy & configure a VPS (10 min)", "Create SSH keys, store securely (3 min)", "SSH into your server (3 min)", "Install Node.js + NPM (5 min)", "Install & configure n8n (5 min)", "Set up reverse proxy + SSL (7 min)", "Configure domain & DNS (5 min)"].map((s, i) => (
              <div className="step-item" key={i}><div className="step-num">{i + 1}</div>{s}</div>
            ))}
            <div className="time-badge slow">⏱ ~38 minutes total</div>
          </div>
          <div className="compare-card good">
            <div className="compare-head good">✓ With n8nShip</div>
            {["Enter your email & instance name", "Pick a plan", "Click deploy"].map((s, i) => (
              <div className="step-item done" key={i}><div className="step-num done">{i + 1}</div>{s}</div>
            ))}
            <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }} />
            <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }} />
            <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }} />
            <div style={{ padding: "10px 0" }} />
            <div className="time-badge fast">⚡ Under 60 seconds</div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section" id="how">
        <div className="section-label">// How it works</div>
        <div className="section-title">Three steps.<br />That's actually it.</div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-icon">⚙️</div>
            <div className="how-title">Pick your plan</div>
            <div className="how-body">Free tier gets you a hosted n8n instance on shared infrastructure. Pro gets you a dedicated server with more memory & custom domain.</div>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-icon">📧</div>
            <div className="how-title">Enter your details</div>
            <div className="how-body">Just your email and what you want your n8n instance called. No SSH keys. No terminal. No Docker knowledge needed.</div>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-icon">🚀</div>
            <div className="how-title">Get your URL</div>
            <div className="how-body">We spin up your n8n instance on Railway. You get a live URL in under 60 seconds. Login credentials sent straight to your email.</div>
          </div>
        </div>
        <div className="terminal">
          <div className="terminal-bar">
            <div className="t-dot" style={{ background: "#ff5f57" }} />
            <div className="t-dot" style={{ background: "#febc2e" }} />
            <div className="t-dot" style={{ background: "#28c840" }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)", fontFamily: "JetBrains Mono" }}>n8nship deploy</span>
          </div>
          <div className="terminal-body">
            <div className="t-line"><span className="t-prompt">→</span><span className="t-cmd">Provisioning server on Railway...</span></div>
            <div className="t-line"><span className="t-success">✓</span><span className="t-cmd">Server ready</span><span className="t-comment"> (8.2s)</span></div>
            <div className="t-line"><span className="t-success">✓</span><span className="t-cmd">n8n installed</span><span className="t-comment"> (14.1s)</span></div>
            <div className="t-line"><span className="t-success">✓</span><span className="t-cmd">SSL certificate issued</span><span className="t-comment"> (22.3s)</span></div>
            <div className="t-line"><span className="t-success">✓</span><span className="t-cmd">Instance live at your-name.up.railway.app</span></div>
            <div className="t-line"><span className="t-prompt">→</span><span className="t-cmd t-success">Done in 47 seconds. Credentials sent to email.</span></div>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="section" id="pricing">
        <div className="section-label">// Pricing</div>
        <div className="section-title" style={{ textAlign: "center" }}>Simple, honest pricing.</div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-name">Starter</div>
            <div className="price-amount">$0 <span>/ forever</span></div>
            <div className="price-desc">Perfect for trying n8n and building your first workflows.</div>
            <ul className="price-features">
              {["Shared n8n instance", "Up to 5 active workflows", "Railway free tier hosting", "Community support", "SSL included"].map((f, i) => (
                <li key={i}><span className="check">✦</span>{f}</li>
              ))}
            </ul>
            <button className="price-btn free" onClick={() => openWizard("free")}>Deploy Free →</button>
          </div>
          <div className="price-card pro">
            <div className="price-name">Pro</div>
            <div className="price-amount">{price.symbol}{price.display} <span>/ month</span></div>
            <div className="price-desc">For teams and serious automators who need reliability.</div>
            <ul className="price-features">
              {["Dedicated n8n instance", "Unlimited workflows", "Custom domain support", "Priority support + onboarding", "Auto-backups daily", "More RAM & CPU"].map((f, i) => (
                <li key={i}><span className="check">✦</span>{f}</li>
              ))}
            </ul>
            <button className="price-btn pro" onClick={() => openWizard("pro")}>Get Pro →</button>
          </div>
        </div>
      </div>

      {/* SECURITY */}
      <div id="security" className="security-row">
        {[
          { icon: "🔒", label: "SSL / HTTPS everywhere" },
          { icon: "💳", label: "Payments via Stripe" },
          { icon: "🛡️", label: "No data stored client-side" },
          { icon: "🔑", label: "Credentials emailed securely" },
          { icon: "🌍", label: "Railway infrastructure" },
        ].map((b, i) => (
          <div className="sec-badge" key={i}><span>{b.icon}</span>{b.label}</div>
        ))}
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">n8n<span>Ship</span></div>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
          <a href="mailto:hello@n8nship.com">Contact</a>
        </div>
      </footer>

      {/* ─── WIZARD ─────────────────────────────────────────── */}
      {wizardOpen && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setWizardOpen(false)}>
          <div className="wizard">
            <div className="wizard-header">
              <div>
                <div className="wizard-title">Deploy your n8n</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "JetBrains Mono", marginTop: 3 }}>
                  {deployed ? "✓ Instance live" : deploying ? "⚡ Deploying..." : `Step ${step} of 3`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="wizard-steps">
                  {steps_meta.map((s, i) => (
                    <div className={`wstep ${step === i + 1 && !deployed ? "active" : step > i + 1 || deployed ? "done" : ""}`} key={i}>
                      {step > i + 1 || deployed ? "✓" : s.n} {s.label}
                    </div>
                  ))}
                </div>
                <button className="close-btn" onClick={() => setWizardOpen(false)}>✕</button>
              </div>
            </div>

            {/* STEP 1: PLAN */}
            {step === 1 && !deploying && !deployed && (
              <>
                <div className="wizard-body">
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Choose your plan</div>
                  <div className="plan-select">
                    {["free", "pro"].map(p => (
                      <div key={p} className={`plan-opt ${plan === p ? "selected" : ""}`} onClick={() => setPlan(p)}>
                        <div className="plan-opt-name">{p === "free" ? "Starter" : "Pro"}</div>
                        <div className="plan-opt-price">{p === "free" ? "Free forever" : "$19 / month"}</div>
                        <div className="plan-opt-feat">
                          {p === "free" ? "Shared hosting\n5 workflows\nFree SSL" : "Dedicated server\nUnlimited workflows\nCustom domain"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="wizard-footer">
                  <button className="btn-wiz-next" onClick={() => setStep(2)} disabled={!plan}>
                    Continue →
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: CONFIG */}
            {step === 2 && !deploying && !deployed && (
              <>
                <div className="wizard-body">
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Configure your instance</div>
                  <label className="wizard-label">Your email</label>
                  <input
                    className="wizard-input"
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                  <label className="wizard-label">Instance name</label>
                  <input
                    className="wizard-input"
                    type="text"
                    placeholder="my-automations"
                    value={form.instance}
                    onChange={e => setForm({ ...form, instance: e.target.value.replace(/\s+/g, "-").toLowerCase() })}
                  />
                  {form.instance && (
                    <div style={{ fontSize: 11, fontFamily: "JetBrains Mono", color: "var(--orange)", marginTop: -10, marginBottom: 16 }}>
                      Your URL: {form.instance}.up.railway.app
                    </div>
                  )}
                  {plan === "pro" && (
                    <div style={{ padding: 14, background: "rgba(255,92,0,0.07)", border: "1px solid rgba(255,92,0,0.2)", borderRadius: 8, fontSize: 12, fontFamily: "JetBrains Mono", color: "var(--muted)", lineHeight: 1.6 }}>
                        💳 After clicking Deploy, you'll complete payment securely. Your instance spins up instantly after confirmation. Includes 3-day free trial!                    </div>
                  )}
                </div>
                <div className="wizard-footer">
                  <button className="btn-wiz-back" onClick={() => setStep(1)}>← Back</button>
                  <button
                    className="btn-wiz-next"
                    onClick={() => { setStep(3); handleDeploy(); }}
                    disabled={!form.email || !form.instance}
                  >
                    {plan === "pro" ? "Pay & Deploy →" : "Deploy →"}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: DEPLOYING */}
            {step === 3 && deploying && (
              <div className="wizard-body">
                <div className="deploy-anim">
                  <div className="spinner" />
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Spinning up your instance...</div>
                  <div className="deploy-log">
                    <div className="log-item"><span className="t-success">✓</span> Allocating server on Railway</div>
                    <div className="log-item"><span className="t-success">✓</span> Installing n8n v1.x</div>
                    <div className="log-item"><span className="t-comment">→</span> Configuring environment...</div>
                    <div className="log-item"><span className="t-comment">→</span> Issuing SSL certificate...</div>
                  </div>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {deployed && (
              <div className="wizard-body">
                <div className="success-card">
                  <div className="success-icon">🚀</div>
                  <div className="success-title">You're live!</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: "JetBrains Mono" }}>
                    Your n8n instance is ready. Login credentials sent to {form.email}
                  </div>
                  <div className="success-url" onClick={() => window.open(`https://${deployUrl}`, "_blank")}>
                    🔗 {deployUrl} ↗
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button className="btn-wiz-next" style={{ justifyContent: "center", padding: "13px" }}
                      onClick={() => window.open(`https://${deployUrl}`, "_blank")}>
                      Open n8n Dashboard →
                    </button>
                    <button className="btn-wiz-back" onClick={() => setWizardOpen(false)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
    </ErrorBoundary>
  );
}