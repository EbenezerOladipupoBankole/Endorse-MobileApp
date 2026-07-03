/**
 * Endorse — e-signature app auth flow
 * Welcome / Sign up / Log in / OTP verification / Signature pad / Success
 * ---------------------------------------------------------------------
 * WEB React reference (HTML + inline CSS). This is a SPEC to translate into
 * Expo / React Native — see README.md ("Expo / React Native handoff").
 * It runs as-is on the web so you can compare behavior side by side.
 *
 * Brand: yellow #FFC72C + light/navy blue. Corporate, trustworthy.
 * Fonts: Sora (display) + Plus Jakarta Sans (UI).
 *   <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
 *
 * Usage: <Endorse onComplete={(mode) => navigate('/home')} />
 */

import React, { useState, useRef, useEffect } from "react";

const T = {
  navy: "#FFFFFF",        // welcome/success screen bg (white); hero panel stays navy
  navyInk: "#14213D",     // primary text / on-yellow text
  cloud: "#F5F8FC",       // light screen bg (forms/otp/sign)
  white: "#FFFFFF",
  ink: "#14213D",
  inkSoft: "#5C6B84",
  label: "#45536B",
  yellow: "#FFC72C",      // primary CTA
  blue: "#2E68B0",        // links / active
  blueSoft: "#EAF2FC",    // icon chip bg
  border: "#E3EAF3",
  fieldBorder: "#DDE5EF",
  errBorder: "#E39C93",
  error: "#C0392B",
  onNavy: "#DCE7F5",
  sora: "'Sora', system-ui, sans-serif",
  jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const SLIDES = [
  { kind: "scan", badge: "Scan", kicker: "Scan on the go", title: "Scan any document with your camera." },
  { kind: "manage", badge: "Organize", kicker: "All in one place", title: "Organize and manage every file." },
  { kind: "sign", badge: "Signed", kicker: "Sign & send", title: "Sign, send and track — instantly." },
];

const MG_ROWS = [
  { iconBg: "#FFF1C9", iconStroke: "#B8871E", w1: "68%", w2: "40%", tag: "Signed", tagBg: "#FFF1C9", tagFg: "#A9781A" },
  { iconBg: "#EAF2FC", iconStroke: "#2E68B0", w1: "54%", w2: "46%", tag: "Draft", tagBg: "#EAF2FC", tagFg: "#2E68B0" },
  { iconBg: "#E7F3EC", iconStroke: "#2E9E5B", w1: "72%", w2: "34%", tag: "Sent", tagBg: "#E7F3EC", tagFg: "#2E9E5B" },
];

/* Per-slide static onboarding illustration (non-interactive; fills the panel) */
function OnboardHero({ kind }) {
  if (kind === "scan") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", transform: "translateY(-9%)" }}>
          <div style={{ position: "absolute", top: 14, left: -30, width: 150, height: 196, background: "#294a76", borderRadius: 13, transform: "rotate(-9deg)", boxShadow: "0 18px 36px rgba(6,14,28,0.4)" }} />
          <div style={{ position: "absolute", top: 8, left: -14, width: 158, height: 200, background: "#34588a", borderRadius: 13, transform: "rotate(4deg)", boxShadow: "0 18px 36px rgba(6,14,28,0.4)" }} />
          <div style={{ position: "relative", width: 176, background: "#FBFCFE", borderRadius: 13, padding: "24px 22px", boxShadow: "0 28px 54px rgba(6,14,28,0.6)", transform: "rotate(-2deg)" }}>
            {["56%", "94%", "86%", "92%", "78%", "88%", "54%"].map((w, i) => <div key={i} style={{ height: i === 0 ? 7 : 6, width: w, borderRadius: i === 0 ? 4 : 3, background: i === 0 ? "#C7D3E4" : "#E7ECF3", marginBottom: i < 6 ? (i === 0 ? 12 : 10) : 0 }} />)}
          </div>
          <div style={{ position: "absolute", top: -10, left: -12, width: 30, height: 30, borderTop: "3.5px solid #FFC72C", borderLeft: "3.5px solid #FFC72C", borderRadius: "7px 0 0 0" }} />
          <div style={{ position: "absolute", top: -10, right: -12, width: 30, height: 30, borderTop: "3.5px solid #FFC72C", borderRight: "3.5px solid #FFC72C", borderRadius: "0 7px 0 0" }} />
          <div style={{ position: "absolute", bottom: -10, left: -12, width: 30, height: 30, borderBottom: "3.5px solid #FFC72C", borderLeft: "3.5px solid #FFC72C", borderRadius: "0 0 0 7px" }} />
          <div style={{ position: "absolute", bottom: -10, right: -12, width: 30, height: 30, borderBottom: "3.5px solid #FFC72C", borderRight: "3.5px solid #FFC72C", borderRadius: "0 0 7px 0" }} />
          <div style={{ position: "absolute", left: -10, right: -10, top: "46%", height: 3, background: "#FFC72C", boxShadow: "0 0 16px 3px rgba(255,199,44,0.8)" }} />
        </div>
      </div>
    );
  }
  if (kind === "manage") {
    return (
      <div style={{ position: "absolute", inset: 0, zIndex: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 236, background: "#FBFCFE", borderRadius: 16, padding: 16, boxShadow: "0 28px 54px rgba(6,14,28,0.6)", transform: "translateY(-9%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 12px", borderRadius: 10, background: "#EEF3F9", marginBottom: 14 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.2" stroke="#9AA7BC" strokeWidth="1.6"/><path d="M11 11l3.2 3.2" stroke="#9AA7BC" strokeWidth="1.6" strokeLinecap="round"/></svg>
            <div style={{ height: 5, width: "44%", borderRadius: 3, background: "#CFD8E5" }} />
          </div>
          {MG_ROWS.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 4px", borderBottom: "1px solid #EEF2F7" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: r.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 1.5h5L13 5.5V14a.5.5 0 0 1-.5.5h-8A.5.5 0 0 1 4 14V2a.5.5 0 0 1 .5-.5Z" stroke={r.iconStroke} strokeWidth="1.3"/><path d="M9 1.5V5.5H13" stroke={r.iconStroke} strokeWidth="1.3" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 6, width: r.w1, borderRadius: 3, background: "#CFD8E5", marginBottom: 6 }} />
                <div style={{ height: 5, width: r.w2, borderRadius: 3, background: "#E7ECF3" }} />
              </div>
              <div style={{ height: 18, padding: "0 9px", borderRadius: 9, background: r.tagBg, display: "flex", alignItems: "center", fontSize: 8.5, fontWeight: 700, color: r.tagFg }}>{r.tag}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", transform: "translateY(-9%)" }}>
        <div style={{ position: "absolute", top: 10, left: -18, width: 160, height: 204, background: "#34588a", borderRadius: 13, transform: "rotate(5deg)", boxShadow: "0 18px 36px rgba(6,14,28,0.4)" }} />
        <div style={{ position: "relative", width: 180, background: "#FBFCFE", borderRadius: 13, padding: "22px 20px 24px", boxShadow: "0 28px 54px rgba(6,14,28,0.6)", transform: "rotate(-3deg)" }}>
          <div style={{ height: 7, width: "60%", borderRadius: 4, background: "#C7D3E4", marginBottom: 12 }} />
          <div style={{ height: 6, width: "92%", borderRadius: 3, background: "#E7ECF3", marginBottom: 10 }} />
          <div style={{ height: 6, width: "84%", borderRadius: 3, background: "#E7ECF3", marginBottom: 10 }} />
          <div style={{ height: 6, width: "90%", borderRadius: 3, background: "#E7ECF3", marginBottom: 22 }} />
          <div style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: "#9AA7BC", fontWeight: 700, marginBottom: 6 }}>Signature</div>
          <svg width="130" height="34" viewBox="0 0 118 30" fill="none"><path d="M3 21c7-13 12-16 15-9s4 15 8 12 5-18 9-16 3 17 8 15 8-16 13-13 6 12 11 9 9-11 14-6 10 5 18 2" stroke="#1D3358" strokeWidth="2.6" strokeLinecap="round"/></svg>
          <div style={{ height: 1.5, background: "#C9D3E0", marginTop: 3 }} />
        </div>
        <div style={{ position: "absolute", bottom: -16, right: -18, width: 58, height: 58, borderRadius: "50%", background: "#FFC72C", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 26px rgba(6,14,28,0.4)", transform: "rotate(-8deg)", border: "2.5px dashed rgba(20,33,61,0.35)" }}>
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none"><path d="M2 11l7 7L24 2" stroke="#14213D" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
    </div>
  );
}

/* Small yellow accent badge shown top-right of the hero */
function HeroBadge({ kind, label }) {
  const icon = kind === "scan"
    ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.6" stroke="#14213D" strokeWidth="1.4"/><path d="M4.5 3 5.4 1.4h3.2L9.5 3" stroke="#14213D" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="7" cy="7.4" r="2.2" stroke="#14213D" strokeWidth="1.4"/></svg>
    : kind === "sign"
    ? <svg width="12" height="10" viewBox="0 0 11 9" fill="none"><path d="M1 4.5 4 8l6-7" stroke="#14213D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3l1.4 1.6H13A1.5 1.5 0 0 1 14.5 6v6A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12V4.5Z" stroke="#14213D" strokeWidth="1.4"/></svg>;
  return (
    <div style={{ position: "absolute", top: 18, right: 18, zIndex: 3, background: "#FFC72C", color: "#14213D", fontSize: 11, fontWeight: 700, padding: "7px 13px", borderRadius: 20, boxShadow: "0 8px 18px rgba(6,14,28,0.35)", display: "flex", alignItems: "center", gap: 6 }}>{icon}{label}</div>
  );
}

const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Endorse({ onComplete }) {
  const [screen, setScreen] = useState("welcome"); // welcome|signup|login|otp|sign|done
  const [step, setStep] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneFrom, setDoneFrom] = useState("signup");

  const [su, setSu] = useState({ name: "", email: "", pass: "", terms: false });
  const [suT, setSuT] = useState({});
  const [suSubmit, setSuSubmit] = useState(false);

  const [li, setLi] = useState({ email: "", pass: "" });
  const [liT, setLiT] = useState({});
  const [liSubmit, setLiSubmit] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSubmit, setOtpSubmit] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()));

  const [hasSig, setHasSig] = useState(false);
  const [sigTouched, setSigTouched] = useState(false);
  const sigCanvas = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);

  const dark = screen === "welcome" || screen === "done";

  /* resend countdown */
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  /* validation */
  const suErr = {
    name: !su.name.trim() ? "Please enter your name" : "",
    email: !su.email.trim() ? "Email is required" : (!emailOK(su.email) ? "Enter a valid email address" : ""),
    pass: su.pass.length < 8 ? "Use at least 8 characters" : "",
    terms: !su.terms ? "Please accept the terms to continue" : "",
  };
  const liErr = {
    email: !li.email.trim() ? "Email is required" : (!emailOK(li.email) ? "Enter a valid email address" : ""),
    pass: !li.pass ? "Enter your password" : "",
  };
  const showSu = (f) => (suSubmit || suT[f]) ? suErr[f] : "";
  const showLi = (f) => (liSubmit || liT[f]) ? liErr[f] : "";

  const finish = (from) => {
    if (submitting) return;
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setDoneFrom(from); setScreen("done"); }, from === "login" ? 900 : 200);
  };
  const submitSignup = () => {
    setSuSubmit(true);
    if (!suErr.name && !suErr.email && !suErr.pass && !suErr.terms) {
      setSubmitting(true);
      setTimeout(() => { setSubmitting(false); setOtp(["", "", "", "", "", ""]); setOtpSubmit(false); setScreen("otp"); setResendIn(30); }, 1100);
    }
  };
  const submitLogin = () => {
    setLiSubmit(true);
    if (!liErr.email && !liErr.pass) finish("login");
  };

  /* OTP */
  const onOtp = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => { const n = prev.slice(); n[i] = d; return n; });
    if (d && i < 5) otpRefs.current[i + 1].current?.focus();
  };
  const onOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1].current?.focus();
  };
  const submitOtp = () => {
    setOtpSubmit(true);
    if (otp.join("").length === 6) {
      setSubmitting(true);
      setTimeout(() => { setSubmitting(false); setSigTouched(false); setHasSig(false); setScreen("sign"); }, 1000);
    }
  };
  const otpErr = otpSubmit && otp.join("").length < 6 ? "Please enter all 6 digits" : "";

  /* signature canvas (WEB). RN: use react-native-signature-canvas or an SVG-path
     PanResponder — see README. */
  const pt = (e) => {
    const c = sigCanvas.current, r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const sigDown = (e) => {
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    drawing.current = true; last.current = pt(e);
    if (!hasSig) setHasSig(true);
  };
  const sigMove = (e) => {
    if (!drawing.current) return;
    const ctx = sigCanvas.current.getContext("2d"), p = pt(e);
    ctx.strokeStyle = T.navyInk; ctx.lineWidth = 2.6; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
  };
  const sigUp = () => { drawing.current = false; last.current = null; };
  const clearSig = () => { const c = sigCanvas.current; c && c.getContext("2d").clearRect(0, 0, c.width, c.height); setHasSig(false); };
  const submitSig = () => { setSigTouched(true); if (hasSig) finish("signup"); };

  /* password strength 0-3 */
  const strength = (() => { const p = su.pass; let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++; if (/\d/.test(p) || /[^A-Za-z0-9]/.test(p)) s++; return Math.min(s, 3); })();
  const sColors = ["#D9534F", "#E0A82E", "#2E9E5B"];
  const sLabels = ["Weak", "Fair", "Strong"];
  const sColor = su.pass ? sColors[Math.max(0, strength - 1)] : T.fieldBorder;
  const pwType = showPw ? "text" : "password";

  /* shared styles */
  const input = (err) => ({ width: "100%", height: 52, padding: "0 16px", borderRadius: 13, border: `1.5px solid ${err ? T.errBorder : T.fieldBorder}`, background: T.white, fontSize: 15, color: T.ink, fontFamily: T.jakarta, boxSizing: "border-box" });
  const labelS = { display: "block", fontSize: 13, fontWeight: 600, color: T.label, margin: "0 0 7px" };
  const errS = { minHeight: 18, padding: "4px 2px 0", fontSize: 12.5, color: T.error, fontWeight: 500 };
  const socialBtn = { height: 54, border: `1px solid ${T.border}`, borderRadius: 14, background: T.white, display: "flex", alignItems: "center", justifyContent: "center", gap: 11, cursor: "pointer", fontFamily: T.jakarta, fontSize: 15, fontWeight: 600, color: T.ink };
  const primary = { width: "100%", height: 56, marginTop: 12, border: "none", borderRadius: 15, background: T.yellow, color: T.navyInk, fontFamily: T.jakarta, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 10px 24px rgba(255,199,44,0.32)" };
  const Spinner = () => <span style={{ width: 18, height: 18, border: "2.5px solid rgba(20,33,61,0.28)", borderTopColor: T.navyInk, borderRadius: "50%", animation: "end-spin 0.7s linear infinite" }} />;
  const Google = () => <svg width="19" height="19" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.6 9.2c0-.6-.05-1.18-.16-1.74H9v3.3h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.66-3.88 2.66-6.54z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.95 10.7a5.4 5.4 0 0 1 0-3.4V4.96H.94a9 9 0 0 0 0 8.08l3.01-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .94 4.96l3.01 2.34C4.66 5.17 6.65 3.58 9 3.58z"/></svg>;
  const Apple = () => <svg width="17" height="19" viewBox="0 0 15 18" fill={T.navyInk}><path d="M12.6 9.6c-.02-1.7.76-2.98 2.34-3.92-.88-1.26-2.22-1.96-3.98-2.1-1.67-.13-3.5.98-4.17.98-.7 0-2.32-.94-3.6-.94C.6 3.66-.9 5.9-.9 8.86c0 1.34.24 2.72.73 4.14.65 1.86 3 6.42 5.44 6.34 1.14-.03 1.95-.81 3.43-.81 1.44 0 2.19.81 3.46.81 2.47-.04 4.59-4.18 5.21-6.05-3.3-1.56-3.12-4.56-3.12-4.66z" transform="translate(0.9 -1.4)"/><path d="M10.6 2.6C11.7 1.3 11.6-.1 11.56-.6c-1.12.06-2.42.76-3.16 1.62-.8.92-1.28 2.06-1.17 3.3 1.22.1 2.33-.53 3.37-1.72z" transform="translate(0.9 0.6)"/></svg>;
  const Eye = () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6"/></svg>;
  const Back = ({ to }) => (
    <button onClick={() => to()} style={{ width: 42, height: 42, borderRadius: 12, border: `1px solid ${T.border}`, background: T.white, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 22 }}>
      <svg width="18" height="16" viewBox="0 0 18 16" fill="none"><path d="M17 8H1M7 2 1 8l6 6" stroke="#1D3358" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );

  let body = null;

  if (screen === "welcome") {
    const sl = SLIDES[step], lastStep = step === SLIDES.length - 1;
    body = (
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", flex: 1, minHeight: 0, margin: "4px 16px 0", borderRadius: 28, overflow: "hidden", background: "linear-gradient(160deg, #1D3358 0%, #0E1D34 100%)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 78% 18%, rgba(255,199,44,0.16), transparent 42%), radial-gradient(circle at 12% 88%, rgba(126,178,229,0.18), transparent 46%)" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "100% 26px" }} />
          <OnboardHero kind={sl.kind} />
          <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: "linear-gradient(to top, rgba(8,16,30,0.94) 0%, rgba(8,16,30,0.58) 34%, rgba(8,16,30,0.14) 62%, transparent 84%)" }} />
          <HeroBadge kind={sl.kind} label={sl.badge} />
          <div style={{ position: "relative", zIndex: 2, marginTop: "auto", padding: "0 26px 26px", pointerEvents: "none" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: T.yellow, marginBottom: 11 }}>{sl.kicker}</div>
            <div style={{ fontFamily: T.sora, fontSize: 29, lineHeight: 1.15, fontWeight: 600, color: "#F8FAFD", letterSpacing: -0.5, textShadow: "0 2px 18px rgba(6,14,28,0.5)" }}>{sl.title}</div>
          </div>
        </div>
        <div style={{ flexShrink: 0, padding: "22px 26px 26px" }}>
          <div style={{ display: "flex", gap: 7, marginBottom: 22 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ height: 4, borderRadius: 3, width: i === step ? 26 : 7, background: i === step ? T.yellow : "#E1E7F0", transition: "all 0.35s ease" }} />)}
          </div>
          {lastStep ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <button onClick={() => setScreen("signup")} style={{ height: 56, border: "none", borderRadius: 16, background: T.yellow, color: T.navyInk, fontFamily: T.jakarta, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 22px rgba(255,199,44,0.34)" }}>Create account</button>
              <button onClick={() => setScreen("login")} style={{ height: 56, border: "1px solid #E3EAF3", borderRadius: 16, background: "#FFFFFF", color: "#14213D", fontFamily: T.jakarta, fontSize: 16, fontWeight: 600, cursor: "pointer" }}>I already have an account</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setStep(SLIDES.length - 1)} style={{ border: "none", background: "transparent", color: "#5C6B84", fontFamily: T.jakarta, fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 10 }}>Skip</button>
              <button onClick={() => setStep((s) => Math.min(s + 1, SLIDES.length - 1))} style={{ height: 56, padding: "0 30px", border: "none", borderRadius: 16, background: T.yellow, color: T.navyInk, fontFamily: T.jakarta, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 10px 22px rgba(255,199,44,0.34)" }}>Continue
                <svg width="17" height="14" viewBox="0 0 17 14" fill="none"><path d="M1 7h14M10 2l5 5-5 5" stroke={T.navyInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === "signup") {
    body = (
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "6px 26px 34px" }}>
          <Back to={() => { setScreen("welcome"); setStep(0); }} />
          <h1 style={{ fontFamily: T.sora, fontSize: 28, fontWeight: 600, color: T.ink, margin: "0 0 8px", letterSpacing: -0.5 }}>Create your account</h1>
          <p style={{ fontSize: 15, color: T.inkSoft, margin: "0 0 24px", lineHeight: 1.5 }}>Join <span style={{ fontWeight: 700, color: T.blue }}>Endorse</span> and start signing documents in seconds.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 22 }}>
            <button onClick={() => finish("signup")} style={socialBtn}><Google /> Continue with Google</button>
            <button onClick={() => finish("signup")} style={socialBtn}><Apple /> Continue with Apple</button>
          </div>
          <Divider>or sign up with email</Divider>
          <label style={labelS}>Full name</label>
          <input value={su.name} onChange={(e) => setSu({ ...su, name: e.target.value })} onBlur={() => setSuT({ ...suT, name: true })} placeholder="Alex Morgan" style={input(showSu("name"))} />
          <div style={errS}>{showSu("name")}</div>
          <label style={{ ...labelS, margin: "6px 0 7px" }}>Email</label>
          <input value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} onBlur={() => setSuT({ ...suT, email: true })} placeholder="you@email.com" style={input(showSu("email"))} />
          <div style={errS}>{showSu("email")}</div>
          <label style={{ ...labelS, margin: "6px 0 7px" }}>Password</label>
          <div style={{ position: "relative" }}>
            <input type={pwType} value={su.pass} onChange={(e) => setSu({ ...su, pass: e.target.value })} onBlur={() => setSuT({ ...suT, pass: true })} placeholder="At least 8 characters" style={{ ...input(showSu("pass")), padding: "0 48px 0 16px" }} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 6, top: 6, width: 40, height: 40, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#8494AB" }}><Eye /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 18, padding: "6px 2px 0" }}>
            {su.pass && !showSu("pass") && (<>
              <div style={{ flex: 1, display: "flex", gap: 4 }}>{[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? sColor : "#E7ECF3" }} />)}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: sColor }}>{sLabels[Math.max(0, strength - 1)]}</span>
            </>)}
            {showSu("pass") && <span style={{ fontSize: 12.5, color: T.error, fontWeight: 500 }}>{showSu("pass")}</span>}
          </div>
          <div onClick={() => setSu({ ...su, terms: !su.terms })} style={{ display: "flex", alignItems: "flex-start", gap: 11, margin: "10px 0 4px", cursor: "pointer" }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `1.5px solid ${showSu("terms") ? T.errBorder : su.terms ? T.blue : "#C4CFDE"}`, background: su.terms ? T.blue : T.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {su.terms && <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1 5l4 4 7-8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>I agree to the <span style={{ color: T.blue, fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: T.blue, fontWeight: 600 }}>e-Sign Consent</span>.</span>
          </div>
          <div style={{ minHeight: 16, padding: "2px 0 0 33px", fontSize: 12.5, color: T.error, fontWeight: 500 }}>{showSu("terms")}</div>
          <button onClick={submitSignup} style={primary}>{submitting && <Spinner />}<span>{submitting ? "Creating account…" : "Create account"}</span></button>
        </div>
      </div>
    );
  }

  if (screen === "login") {
    body = (
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "6px 26px 34px" }}>
          <Back to={() => { setScreen("welcome"); setStep(0); }} />
          <h1 style={{ fontFamily: T.sora, fontSize: 28, fontWeight: 600, color: T.ink, margin: "0 0 8px", letterSpacing: -0.5 }}>Welcome back</h1>
          <p style={{ fontSize: 15, color: T.inkSoft, margin: "0 0 24px", lineHeight: 1.5 }}>Sign in to pick up right where you left off.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 22 }}>
            <button onClick={() => finish("login")} style={socialBtn}><Google /> Continue with Google</button>
            <button onClick={() => finish("login")} style={socialBtn}><Apple /> Continue with Apple</button>
          </div>
          <Divider>or</Divider>
          <label style={labelS}>Email</label>
          <input value={li.email} onChange={(e) => setLi({ ...li, email: e.target.value })} onBlur={() => setLiT({ ...liT, email: true })} placeholder="you@email.com" style={input(showLi("email"))} />
          <div style={errS}>{showLi("email")}</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "6px 0 7px" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: T.label }}>Password</label>
            <span style={{ fontSize: 12.5, color: T.blue, fontWeight: 600, cursor: "pointer" }}>Forgot?</span>
          </div>
          <div style={{ position: "relative" }}>
            <input type={pwType} value={li.pass} onChange={(e) => setLi({ ...li, pass: e.target.value })} onBlur={() => setLiT({ ...liT, pass: true })} placeholder="Your password" style={{ ...input(showLi("pass")), padding: "0 48px 0 16px" }} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 6, top: 6, width: 40, height: 40, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#8494AB" }}><Eye /></button>
          </div>
          <div style={errS}>{showLi("pass")}</div>
          <button onClick={submitLogin} style={primary}>{submitting && <Spinner />}<span>{submitting ? "Signing in…" : "Log in"}</span></button>
          <div style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: T.inkSoft }}>New here? <span onClick={() => setScreen("signup")} style={{ color: T.blue, fontWeight: 700, cursor: "pointer" }}>Create an account</span></div>
        </div>
      </div>
    );
  }

  if (screen === "otp") {
    body = (
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "6px 26px 34px" }}>
          <Back to={() => setScreen("signup")} />
          <div style={{ width: 52, height: 52, borderRadius: 15, background: T.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke={T.blue} strokeWidth="1.8"/><path d="M3 7l9 6 9-6" stroke={T.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h1 style={{ fontFamily: T.sora, fontSize: 28, fontWeight: 600, color: T.ink, margin: "0 0 8px", letterSpacing: -0.5 }}>Verify your email</h1>
          <p style={{ fontSize: 15, color: T.inkSoft, margin: "0 0 28px", lineHeight: 1.5 }}>Enter the 6-digit code we sent to <span style={{ color: T.ink, fontWeight: 600 }}>{su.email || "you@email.com"}</span>.</p>
          <div style={{ display: "flex", gap: 9, marginBottom: 8 }}>
            {otp.map((v, i) => (
              <input key={i} ref={otpRefs.current[i]} value={v} onChange={(e) => onOtp(i, e.target.value)} onKeyDown={(e) => onOtpKey(i, e)} inputMode="numeric" maxLength={1}
                style={{ width: "100%", height: 60, textAlign: "center", fontFamily: T.sora, fontSize: 24, fontWeight: 600, color: T.ink, borderRadius: 13, border: `1.5px solid ${otpErr && !v ? T.errBorder : v ? T.blue : T.fieldBorder}`, background: v ? "#F4F9FF" : T.white, boxSizing: "border-box" }} />
            ))}
          </div>
          <div style={{ minHeight: 20, padding: "4px 2px 0", fontSize: 12.5, color: T.error, fontWeight: 500 }}>{otpErr}</div>
          <button onClick={submitOtp} style={{ ...primary, marginTop: 10 }}>{submitting && <Spinner />}<span>{submitting ? "Verifying…" : "Verify & continue"}</span></button>
          <div style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: T.inkSoft }}>
            {resendIn === 0 ? "Didn't get it? " : `Resend available in ${resendIn}s`}
            {resendIn === 0 && <span onClick={() => { setOtp(["", "", "", "", "", ""]); setResendIn(30); }} style={{ color: T.blue, fontWeight: 700, cursor: "pointer" }}>Resend code</span>}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "sign") {
    body = (
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "6px 26px 30px" }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: "#FFF4D6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 20c4-9 6-11 7.5-6.5S12 21 13.5 18 15 8 17 9.5s2 6 5 4" stroke="#C79320" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <h1 style={{ fontFamily: T.sora, fontSize: 28, fontWeight: 600, color: T.ink, margin: "0 0 8px", letterSpacing: -0.5 }}>Create your signature</h1>
          <p style={{ fontSize: 15, color: T.inkSoft, margin: "0 0 20px", lineHeight: 1.5 }}>Draw it once with your finger — we'll use it to sign your documents.</p>
          <div style={{ position: "relative", borderRadius: 16, border: `1.5px dashed ${sigTouched && !hasSig ? T.errBorder : "#C9D6E6"}`, background: T.white, overflow: "hidden", touchAction: "none" }}>
            <div style={{ position: "absolute", left: 20, right: 20, bottom: 30, height: 1.5, background: T.border }} />
            <div style={{ position: "absolute", left: 20, bottom: 14, fontSize: 11, color: "#B4C0D2", fontWeight: 600, letterSpacing: 0.5 }}>✕ Sign above the line</div>
            <canvas ref={sigCanvas} width={304} height={188} onPointerDown={sigDown} onPointerMove={sigMove} onPointerUp={sigUp} onPointerLeave={sigUp} style={{ display: "block", width: "100%", height: 188, cursor: "crosshair", touchAction: "none" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <div style={{ fontSize: 12.5, color: T.error, fontWeight: 500, minHeight: 16 }}>{sigTouched && !hasSig ? "Please draw your signature" : ""}</div>
            <button onClick={clearSig} style={{ border: "none", background: "transparent", color: T.blue, fontFamily: T.jakarta, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 4 }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M12.5 4l-.6 9a1.5 1.5 0 0 1-1.5 1.4H5.6A1.5 1.5 0 0 1 4 13L3.5 4M6 4V2.5A1 1 0 0 1 7 1.5h2a1 1 0 0 1 1 1V4" stroke={T.blue} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>Clear</button>
          </div>
          <button onClick={submitSig} style={{ ...primary, marginTop: 14 }}>Save signature</button>
          <button onClick={() => finish("signup")} style={{ width: "100%", height: 46, marginTop: 8, border: "none", background: "transparent", color: T.inkSoft, fontFamily: T.jakarta, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>I'll do this later</button>
        </div>
      </div>
    );
  }

  if (screen === "done") {
    body = (
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "32px 40px" }}>
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(160deg, #FFD65A, #FFB800)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 30, boxShadow: "0 16px 40px rgba(255,184,0,0.4)" }}>
          <svg width="44" height="34" viewBox="0 0 44 34" fill="none"><path d="M3 18l12 12L41 4" stroke={T.navyInk} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 style={{ fontFamily: T.sora, fontSize: 30, fontWeight: 600, color: "#14213D", margin: "0 0 12px", letterSpacing: -0.4 }}>{doneFrom === "login" ? "Welcome back!" : "You're all set!"}</h1>
        <p style={{ fontSize: 15.5, color: "#5C6B84", margin: "0 0 40px", lineHeight: 1.55, maxWidth: 268 }}>{doneFrom === "login" ? "You’re signed in. Your documents are waiting for you." : "Your email is verified and your signature is saved. You’re ready to sign."}</p>
        <button onClick={() => onComplete ? onComplete(doneFrom) : (setScreen("welcome"), setStep(0))} style={{ width: "100%", height: 56, border: "none", borderRadius: 15, background: T.yellow, color: T.navyInk, fontFamily: T.jakarta, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 26px rgba(255,199,44,0.32)" }}>Go to dashboard</button>
      </div>
    );
  }

  return <Phone bg={dark ? T.navy : T.cloud} fg={dark ? "#14213D" : "#42506A"}>{body}</Phone>;
}

function Divider({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontSize: 12.5, color: "#90A0B8", fontWeight: 500 }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

/* Device bezel — prototype chrome. In Expo use SafeAreaView + your screen. */
function Phone({ children, bg, fg }) {
  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", fontFamily: T.jakarta, background: "radial-gradient(120% 120% at 50% 0%, #F4F5F7 0%, #E9EBEF 60%, #DEE1E6 100%)" }}>
      <style>{`@keyframes end-spin{to{transform:rotate(360deg)}}::placeholder{color:#9AA7BC}`}</style>
      <div style={{ width: 384, height: 812, borderRadius: 46, padding: 10, background: "linear-gradient(155deg, #1B2A44, #0C1526)", boxShadow: "0 40px 90px rgba(20,35,64,0.4), 0 8px 24px rgba(20,35,64,0.26)", flexShrink: 0 }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 37, overflow: "hidden", display: "flex", flexDirection: "column", background: bg, position: "relative" }}>
          <div style={{ height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px 0 26px", color: fg, position: "relative", zIndex: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.4 }}>9:41</span>
            <div style={{ position: "absolute", left: "50%", top: 9, transform: "translateX(-50%)", width: 15, height: 15, borderRadius: "50%", background: "#0a0f18" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="17" height="12" viewBox="0 0 17 12" fill="none"><rect x="0" y="7" width="3" height="5" rx="1" fill="currentColor"/><rect x="4.5" y="4.5" width="3" height="7.5" rx="1" fill="currentColor"/><rect x="9" y="2" width="3" height="10" rx="1" fill="currentColor"/><rect x="13.5" y="0" width="3" height="12" rx="1" fill="currentColor" opacity="0.4"/></svg>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 11.2 0.6 3.9a10.4 10.4 0 0 1 14.8 0L8 11.2Z" fill="currentColor"/></svg>
              <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="19" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5" fill="none"/><rect x="2.5" y="2.5" width="14" height="7" rx="1.2" fill="currentColor"/><rect x="21" y="4" width="1.6" height="4" rx="0.8" fill="currentColor" opacity="0.5"/></svg>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>{children}</div>
          <div style={{ height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
            <div style={{ width: 128, height: 5, borderRadius: 3, background: fg, opacity: 0.32 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
