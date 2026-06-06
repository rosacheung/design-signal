import { useState, useEffect } from "react";

const TODAY = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

async function callClaude(system: string, user: string): Promise<string> {
  const res = await fetch("/.netlify/functions/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user })
  });
  const data = await res.json();
  return data.text || "";
}

function parseJSON(raw: string) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const s = clean.search(/[\[{]/);
    const e = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]")) + 1;
    return JSON.parse(clean.slice(s, e));
  } catch { return null; }
}

const SOURCES = [
  "awwwards.com", "dribbble.com", "behance.net", "thenounproject.com",
  "itsnicethat.com", "sidebar.io", "fonts.google.com", "design.google",
  "figma.com/blog", "pinterest.com", "land-book.com", "httpster.net",
  "siteinspire.com", "typewolf.com", "fontsinuse.com", "muzli.design",
  "designspiration.com", "mobbin.com", "pageflows.com", "abduzeedo.com",
];

const SCAN_LINES = [
  "SCANNING AWWWARDS.COM...", "PARSING MOTION PATTERNS...", "INDEXING BEHANCE FEEDS...",
  "EXTRACTING TYPOGRAPHY SIGNALS...", "CROSS-REFERENCING DRIBBBLE...",
  "DETECTING BRANDING SHIFTS...", "READING ITS NICE THAT...",
  "COMPILING UI PATTERNS...", "ANALYZING COLOR TRENDS...", "BUILDING SIGNAL INDEX...",
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.:-%#@!?";
function randomChar() { return CHARS[Math.floor(Math.random() * CHARS.length)]; }

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const total = text.length;
    const interval = setInterval(() => {
      frame++;
      const revealed = Math.min(Math.floor(frame / 2), total);
      setDisplay(text.slice(0, revealed) + Array.from({ length: total - revealed }, () => randomChar()).join(""));
      if (revealed >= total) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [started, text]);
  return <>{display}</>;
}

function FloatingChars() {
  const [chars, setChars] = useState<any[]>([]);
  useEffect(() => {
    let id = 0;
    const spawn = () => setChars(c => [...c.slice(-40), { id: id++, char: randomChar(), x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 8 + 8, opacity: Math.random() * 0.06 + 0.02 }]);
    spawn();
    const iv = setInterval(spawn, 120);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const iv = setInterval(() => setChars(c => c.map(ch => ({ ...ch, char: Math.random() > 0.85 ? randomChar() : ch.char }))), 200);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {chars.map(ch => <span key={ch.id} style={{ position: "absolute", left: `${ch.x}%`, top: `${ch.y}%`, fontSize: ch.size, fontFamily: "monospace", fontWeight: 900, color: "#39FF14", opacity: ch.opacity, userSelect: "none" }}>{ch.char}</span>)}
    </div>
  );
}

function IdleScreen() {
  const [lineIndex, setLineIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const [sourceIdx, setSourceIdx] = useState(0);
  useEffect(() => {
    const li = setInterval(() => setLineIndex(i => (i + 1) % SCAN_LINES.length), 2200);
    const tk = setInterval(() => setTick(t => t + 1), 500);
    const si = setInterval(() => setSourceIdx(i => (i + 1) % SOURCES.length), 900);
    return () => { clearInterval(li); clearInterval(tk); clearInterval(si); };
  }, []);
  return (
    <div style={{ padding: "40px 0 60px", position: "relative", minHeight: 340, overflow: "hidden" }}>
      <FloatingChars />
      <div style={{ position: "absolute", left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, #39FF1412 30%, #39FF1420 50%, #39FF1412 70%, transparent 100%)", animation: "scanBar 3s ease-in-out infinite", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 2, paddingLeft: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#2a2a2a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>SCANNING SOURCE</div>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: "#39FF14", letterSpacing: 1, opacity: 0.6 }}>› {SOURCES[sourceIdx]}{tick % 2 === 0 ? "_" : " "}</div>
        </div>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#2a2a2a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>STATUS</div>
          <div key={lineIndex} style={{ fontSize: 13, fontFamily: "monospace", color: "#333", letterSpacing: 0.5, animation: "fadeIn 0.2s ease" }}><ScrambleText text={SCAN_LINES[lineIndex]} delay={0} /></div>
        </div>
        <div style={{ borderLeft: "1px solid #181818", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {SCAN_LINES.slice(0, 5).map((line, i) => (
            <div key={i} style={{ fontSize: 10, fontFamily: "monospace", color: "#1e1e1e", animation: `fadeIn 0.4s ease ${i * 0.3}s both`, display: "flex", gap: 10 }}>
              <span style={{ color: "#222" }}>{String(i).padStart(2, "0")}</span><span>{line}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#222", display: "flex", gap: 10 }}><span>05</span><span>{tick % 2 === 0 ? "█" : " "}</span></div>
        </div>
        <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 10, opacity: 0.4, animation: "fadeIn 1s ease 1s both" }}>
          <div style={{ width: 16, height: 1, background: "#333" }} />
          <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: 2, color: "#444", textTransform: "uppercase" }}>HIT SCAN FOR LIVE SIGNALS</span>
        </div>
      </div>
    </div>
  );
}

const CATS: Record<string, string> = {
  "UI": "#39FF14", "Branding": "#FF3BFF", "Typography": "#FFD600",
  "Motion": "#FF6B00", "Web": "#00EAFF", "Product": "#FF4466",
};

function TrendCard({ item, index }: { item: any; index: number }) {
  const accent = CATS[item.category] || "#fff";
  return (
    <div style={{ borderBottom: "1px solid #141414", padding: "20px 24px", animation: `fadeUp 0.3s ease ${index * 0.05}s both` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: accent, fontFamily: "monospace" }}>{String(index + 1).padStart(2, "0")}</span>
            <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: "#0a0a0a", background: accent, padding: "2px 7px", textTransform: "uppercase", fontFamily: "monospace" }}>{item.category}</span>
            {item.isNew && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: accent, border: `1px solid ${accent}`, padding: "2px 7px", textTransform: "uppercase", fontFamily: "monospace" }}>NEW</span>}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -0.5, lineHeight: 1.25, fontFamily: "'Arial Black','Impact',sans-serif", marginBottom: 8 }}>{item.headline}</div>
          <div style={{ fontSize: 12, color: "#555", fontFamily: "monospace", lineHeight: 1.6, marginBottom: 6 }}>{item.why}</div>
          <div style={{ fontSize: 10, color: "#2a2a2a", fontFamily: "monospace" }}>{item.sources?.join(" · ") || "multiple sources"}</div>
        </div>
        <div style={{ width: 2, height: 48, background: accent, opacity: 0.3, flexShrink: 0, marginTop: 4 }} />
      </div>
    </div>
  );
}

const Spinner = () => (
  <span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid #333", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
);

export default function App() {
  const [trends, setTrends] = useState<any[]>([]);
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [time, setTime] = useState<string | null>(null);

  async function scan() {
    setLoading(true); setScanned(true); setTrends([]); setDigest("");
    const t0 = Date.now();
    const sys = `You are a design intelligence analyst. Use web search across MULTIPLE sources per trend. Return ONLY raw JSON, no markdown:
{"digest":"one punchy sentence, max 15 words, on today's design mood","trends":[{"headline":"SPECIFIC TREND IN ALL CAPS, max 6 words","category":"UI|Branding|Typography|Motion|Web|Product","why":"1-2 sentences explaining why this trend matters and where it's showing up","sources":["Site A","Site B"],"isNew":true}]}
Return 7–8 unique trends. Headlines ALL CAPS. Category must be exactly one of: UI, Branding, Typography, Motion, Web, Product.`;
    const raw = await callClaude(sys, `Today is ${TODAY}. Search Awwwards, Dribbble, Behance, It's Nice That, Sidebar.io. Find 7–8 distinct design trends. Be specific.`);
    const p = parseJSON(raw);
    if (p) { setTrends(p.trends || []); setDigest(p.digest || ""); }
    setTime(((Date.now() - t0) / 1000).toFixed(1));
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "'Arial',sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanBar { 0%{top:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:#39FF14; color:#000; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#0a0a0a} ::-webkit-scrollbar-thumb{background:#222}
      `}</style>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>
        <header style={{ padding: "44px 0 28px", borderBottom: "1px solid #141414" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, color: "#2a2a2a", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 12 }}>DESIGN SIGNAL / {TODAY.toUpperCase()}</div>
              <h1 style={{ fontSize: 62, fontWeight: 900, letterSpacing: -4, lineHeight: 0.92, fontFamily: "'Arial Black','Impact',sans-serif", color: "#fff", animation: "fadeIn 0.5s ease" }}>DESIGN<br />SIGNAL</h1>
            </div>
            <div style={{ textAlign: "right", paddingTop: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: "#2a2a2a", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 10 }}>STATUS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <div style={{ position: "relative", width: 10, height: 10 }}>
                  {scanned && !loading && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#39FF14", animation: "ping 1.6s ease-out infinite" }} />}
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: loading ? "#FF6B00" : scanned ? "#39FF14" : "#2a2a2a", animation: loading ? "pulse 0.9s ease-in-out infinite" : scanned ? "pulse 2.5s ease-in-out infinite" : "none", transition: "background 0.4s ease" }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, color: loading ? "#FF6B00" : scanned ? "#39FF14" : "#2a2a2a", fontFamily: "monospace", letterSpacing: 1.5, animation: loading ? "blink 1s step-end infinite" : "none" }}>
                  {loading ? "SCANNING" : scanned ? "LIVE" : "IDLE"}
                </span>
              </div>
            </div>
          </div>
          {digest && (
            <div style={{ marginTop: 22, padding: "12px 16px", borderLeft: "2px solid #39FF14", animation: "fadeIn 0.5s ease" }}>
              <span style={{ fontSize: 13, color: "#555", fontFamily: "monospace", lineHeight: 1.5 }}>{digest}</span>
            </div>
          )}
        </header>
        <div style={{ padding: "16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #111" }}>
          <span style={{ fontSize: 10, color: "#2a2a2a", fontFamily: "monospace", letterSpacing: 1 }}>{scanned && !loading ? `${trends.length} SIGNALS · ${time}s` : ""}</span>
          <button onClick={scan} disabled={loading} style={{ background: loading ? "transparent" : "#fff", color: loading ? "#444" : "#000", border: loading ? "1px solid #222" : "1px solid #fff", padding: "9px 20px", fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s ease" }}>
            {loading ? <><Spinner /> SCANNING...</> : scanned ? "↺ REFRESH" : "⚡ SCAN NOW"}
          </button>
        </div>
        <main style={{ paddingBottom: 80 }}>
          {!scanned && !loading && <IdleScreen />}
          {loading && trends.length === 0 && (
            <div style={{ paddingTop: 2 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ borderBottom: "1px solid #111", padding: "20px 24px", opacity: 1 - i * 0.14, animation: `fadeIn 0.3s ease ${i * 0.08}s both` }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 20, height: 8, background: "#141414", borderRadius: 1 }} />
                    <div style={{ width: 50, height: 8, background: "#141414", borderRadius: 1 }} />
                  </div>
                  <div style={{ width: `${68 - i * 6}%`, height: 18, background: "#111", borderRadius: 1 }} />
                </div>
              ))}
            </div>
          )}
          {trends.length > 0 && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              {trends.map((item, i) => <TrendCard key={item.headline + i} item={item} index={i} />)}
            </div>
          )}
        </main>
        <footer style={{ borderTop: "1px solid #111", padding: "18px 0", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: "#1e1e1e", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>Design Signal v1.0</span>
          <span style={{ fontSize: 9, color: "#1e1e1e", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>Claude + Web Search</span>
        </footer>
      </div>
    </div>
  );
}
