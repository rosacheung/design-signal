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
  "SCANNING AWWWARDS.COM...",
  "PARSING MOTION PATTERNS...",
  "INDEXING BEHANCE FEEDS...",
  "EXTRACTING TYPOGRAPHY SIGNALS...",
  "CROSS-REFERENCING DRIBBBLE...",
  "DETECTING BRANDING SHIFTS...",
  "READING ITS NICE THAT...",
  "COMPILING UI PATTERNS...",
  "ANALYZING COLOR TRENDS...",
  "BUILDING SIGNAL INDEX...",
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.:-%#@!?";

function randomChar() { return CHARS[Math.floor(Math.random() * CHARS.length)]; }

function ScrambleText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [display, setDisplay] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const total = text.length;
    const interval = setInterval(() => {
      frame++;
      const revealed = Math.min(Math.floor(frame / 2), total);
      const scrambled = text.slice(0, revealed) +
        Array.from({ length: total - revealed }, () => randomChar()).join("");
      setDisplay(scrambled);
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
    const spawn = () => {
      const newChar = {
        id: id++,
        char: randomChar(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 8,
        opacity: Math.random() * 0.06 + 0.02,
        duration: Math.random() * 3000 + 2000,
      };
      setChars(c => [...c.slice(-40), newChar]);
    };
    spawn();
    const iv = setInterval(spawn, 120);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setChars(c => c.map(ch => ({ ...ch, char: Math.random() > 0.85 ? randomChar() : ch.char })));
    }, 200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {chars.map(ch => (
        <span key={ch.id} style={{
          position: "absolute",
          left: `${ch.x}%`, top: `${ch.y}%`,
          fontSize: ch.size, fontFamily: "monospace", fontWeight: 900,
          color: "#39FF14", opacity: ch.opacity,
          transition: "opacity 2s ease",
          letterSpacing: 0,
          userSelect: "none",
        }}>{ch.char}</span>
      ))}
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
      <div style={{
        position: "absolute", left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent 0%, #39FF1412 30%, #39FF1420 50%, #39FF1412 70%, transparent 100%)",
        animation: "scanBar 3s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative", zIndex: 2, paddingLeft: 24 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#2a2a2a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            SCANNING SOURCE
          </div>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: "#39FF14", letterSpacing: 1, opacity: 0.6 }}>
            › {SOURCES[sourceIdx]}{tick % 2 === 0 ? "_" : " "}
          </div>
        </div>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#2a2a2a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            STATUS
          </div>
          <div key={lineIndex} style={{ fontSize: 13, fontFamily: "monospace", color: "#333", letterSpacing: 0.5, animation: "fadeIn 0.2s ease" }}>
            <ScrambleText text={SCAN_LINES[lineIndex]} delay={0} />
          </div>
        </div>
        <div style={{ borderLeft: "1px solid #181818", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {SCAN_LINES.slice(0, 5).map((line, i) => (
            <div key={i} style={{
              fontSize: 10, fontFamily: "monospace", color: "#1e1e1e",
              animation: `fadeIn 0.4s ease ${i * 0.3}s both`,
              display: "flex", gap: 10,
            }}>
              <span style={{ color: "#222" }}>{String(i).padStart(2,"0")}</span>
              <span>{line}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, fontFamily: "monospace", color: "#222", display: "flex", gap: 10 }}>
            <span>05</span>
            <span>{tick % 2 === 0 ? "█" : " "}</span>
          </div>
        </div>
        <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 10, opacity: 0.4, animation: "fadeIn 1s ease 1s both" }}>
          <div style={{ width: 16, height: 1, background: "#333" }} />
          <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: 2, color: "#444", textTransform: "uppercase" }}>
            HIT SCAN FOR LIVE SIGNALS
          </span>
        </div>
      </div>
    </div>
  );
}

const CATS: Record<string, string> = {
  "UI":         "#39FF14",
  "Branding":   "#FF3BFF",
  "Typography": "#FFD600",
  "Motion":     "#FF6B00",
  "Web":        "#00EAFF",
  "Product":    "#FF4466",
};

const Spinner = () => (
  <span style={{display:"inline-block",width:13,height:13,border:"2px solid #333",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
);

function TrendCard({ item, index }: { item: any; index: number }) {
  const [open, setOpen] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [deep, setDeep] = useState<any>(null);
  const accent = CATS[item.category] || "#fff";

  async function expand() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (deep) return;
    setDeepLoading(true);
    const sys = `You are a design analyst. Return ONLY raw JSON, no markdown:
{
  "examples": [
    {"label":"brand or project name","detail":"max 12 words on how they use this","url":"real working URL"}
  ],
  "whyNow": "max 12 words on cultural or tech driver"
}
Exactly 3 examples. Real URLs. Ultra concise.`;
    const raw = await callClaude(sys, `Examples for design trend: "${item.headline}". Category: ${item.category}.`);
    const p = parseJSON(raw);
    if (p) setDeep(p);
    setDeepLoading(false);
  }

  return (
    <div style={{
      borderBottom: "1px solid #141414",
      borderLeft: `2px solid ${open ? accent : "transparent"}`,
      background: open ? "#0e0e0e" : "transparent",
      transition: "all 0.25s ease",
    }}>
      <button onClick={expand} style={{
        width:"100%", background:"none", border:"none", cursor:"pointer",
        padding:"20px 24px", display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:16, textAlign:"left",
      }}>
        <div style={{flex:1}}>
          <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap"}}>
            <span style={{fontSize:10, fontWeight:900, letterSpacing:1.5, textTransform:"uppercase", color: accent, fontFamily:"monospace"}}>
              {String(index + 1).padStart(2,"0")}
            </span>
            <span style={{fontSize:9, fontWeight:900, letterSpacing:1.5, color:"#0a0a0a", background: accent, padding:"2px 7px", textTransform:"uppercase", fontFamily:"monospace"}}>
              {item.category}
            </span>
            {item.isNew && (
              <span style={{fontSize:9, fontWeight:900, letterSpacing:1.5, color: accent, border:`1px solid ${accent}`, padding:"2px 7px", textTransform:"uppercase", fontFamily:"monospace", animation:"fadeIn 0.5s ease"}}>
                NEW
              </span>
            )}
          </div>
          <div style={{fontSize:20, fontWeight:900, color:"#fff", letterSpacing:-0.5, lineHeight:1.25, fontFamily:"'Arial Black', 'Impact', sans-serif", animation: "fadeUp 0.3s ease"}}>
            {item.headline}
          </div>
          <div style={{fontSize:11, color:"#3a3a3a", marginTop:6, fontFamily:"monospace", letterSpacing:0.5}}>
            {item.sources?.join(" · ") || item.source || "multiple sources"}
          </div>
        </div>
        <div style={{
          width:26, height:26, border:`1px solid ${open ? accent : "#222"}`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          color: open ? accent : "#444", fontSize:16, fontWeight:900, marginTop:2,
          transition:"all 0.2s ease",
        }}>
          {open ? "−" : "+"}
        </div>
      </button>

      {open && (
        <div style={{padding:"0 24px 22px", animation:"slideDown 0.25s ease"}}>
          {deepLoading ? (
            <div style={{display:"flex", alignItems:"center", gap:10, color:"#333", fontSize:11, fontFamily:"monospace", padding:"8px 0"}}>
              <Spinner /> FETCHING EXAMPLES...
            </div>
          ) : deep ? (
            <>
              <div style={{display:"flex", flexDirection:"column", gap:0}}>
                {deep.examples?.map((ex: any, i: number) => (
                  <a key={i} href={ex.url} target="_blank" rel="noopener noreferrer"
                    style={{display:"flex", alignItems:"baseline", gap:12, padding:"11px 0", borderBottom:"1px solid #141414", textDecoration:"none", color:"inherit", transition:"padding-left 0.15s ease"}}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.paddingLeft="6px"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.paddingLeft="0px"}
                  >
                    <span style={{fontSize:10, color: accent, fontWeight:900, fontFamily:"monospace", flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:13, fontWeight:900, color:"#fff", fontFamily:"'Arial Black', sans-serif"}}>{ex.label} </span>
                      <span style={{fontSize:12, color:"#444", fontFamily:"monospace"}}>— {ex.detail}</span>
                    </div>
                    <span style={{fontSize:11, color:"#2a2a2a", flexShrink:0}}>↗</span>
                  </a>
                ))}
              </div>
              <div style={{marginTop:14, display:"flex", alignItems:"baseline", gap:8}}>
                <span style={{fontSize:9, fontWeight:900, letterSpacing:2, color: accent, fontFamily:"monospace", textTransform:"uppercase", flexShrink:0}}>WHY NOW</span>
                <span style={{fontSize:11, color:"#444", fontFamily:"monospace"}}>{deep.whyNow}</span>
              </div>
            </>
          ) : (
            <div style={{fontSize:11, color:"#333", fontFamily:"monospace"}}>No data.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [trends, setTrends] = useState<any[]>([]);
  const [digest, setDigest] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [time, setTime] = useState<string | null>(null);

  async function scan() {
    setLoading(true); setScanned(true); setTrends([]); setDigest("");
    const t0 = Date.now();
    const sys = `You are a design intelligence analyst. Use web search across MULTIPLE sources per trend (Awwwards, Dribbble, Behance, It's Nice That, Sidebar, design newsletters, tech blogs). Return ONLY raw JSON, no markdown:
{
  "digest": "one punchy sentence, max 15 words, on today's design mood",
  "trends": [
    {
      "headline": "SPECIFIC TREND IN ALL CAPS, max 6 words",
      "category": "UI|Branding|Typography|Motion|Web|Product",
      "why": "max 10 words — the core reason this matters",
      "sources": ["Site A", "Site B"],
      "isNew": true or false
    }
  ]
}
IMPORTANT: Merge similar trends from different sources into one card. Return 7–8 unique trends. Headlines ALL CAPS, punchy and specific. Category must be exactly one of: UI, Branding, Typography, Motion, Web, Product.`;
    const raw = await callClaude(sys, `Today is ${TODAY}. Search broadly across Awwwards, Dribbble, Behance, It's Nice That, Sidebar.io, design Twitter/X, and newsletters. Find 7–8 distinct, high-signal design trends. Merge duplicates. Be specific.`);
    const p = parseJSON(raw);
    if (p) { setTrends(p.trends || []); setDigest(p.digest || ""); }
    setTime(((Date.now() - t0) / 1000).toFixed(1));
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh", background:"#080808", color:"#fff", fontFamily:"'Arial', sans-serif"}}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        @keyframes ping { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanBar { 0%{top:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:#39FF14; color:#000; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:#0a0a0a} ::-webkit-scrollbar-thumb{background:#222}
      `}</style>

      <div style={{maxWidth:760, margin:"0 auto", padding:"0 20px"}}>
        <header style={{padding:"44px 0 28px", borderBottom:"1px solid #141414"}}>
          <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:20}}>
            <div>
              <div style={{fontSize:10, fontWeight:900, letterSpacing:3, color:"#2a2a2a", textTransform:"uppercase", fontFamily:"monospace", marginBottom:12}}>
                DESIGN SIGNAL / {TODAY.toUpperCase()}
              </div>
              <h1 style={{fontSize:62, fontWeight:900, letterSpacing:-4, lineHeight:0.92, fontFamily:"'Arial Black','Impact',sans-serif", color:"#fff", animation:"fadeIn 0.5s ease"}}>
                DESIGN<br/>SIGNAL
              </h1>
            </div>
            <div style={{textAlign:"right", paddingTop:6}}>
              <div style={{fontSize:9, fontWeight:900, letterSpacing:2, color:"#2a2a2a", textTransform:"uppercase", fontFamily:"monospace", marginBottom:10}}>STATUS</div>
              <div style={{display:"flex", alignItems:"center", gap:8, justifyContent:"flex-end"}}>
                <div style={{position:"relative", width:10, height:10}}>
                  {scanned && !loading && (
                    <div style={{position:"absolute", inset:0, borderRadius:"50%", background:"#39FF14", animation:"ping 1.6s ease-out infinite"}}/>
                  )}
                  <div style={{
                    position:"absolute", inset:0, borderRadius:"50%",
                    background: loading ? "#FF6B00" : scanned ? "#39FF14" : "#2a2a2a",
                    animation: loading ? "pulse 0.9s ease-in-out infinite" : scanned ? "pulse 2.5s ease-in-out infinite" : "none",
                    transition:"background 0.4s ease",
                  }}/>
                </div>
                <span style={{fontSize:10, fontWeight:900, color: loading ? "#FF6B00" : scanned ? "#39FF14" : "#2a2a2a", fontFamily:"monospace", letterSpacing:1.5, animation: loading ? "blink 1s step-end infinite" : "none"}}>
                  {loading ? "SCANNING" : scanned ? "LIVE" : "IDLE"}
                </span>
              </div>
            </div>
          </div>
          {digest && (
            <div style={{marginTop:22, padding:"12px 16px", borderLeft:"2px solid #39FF14", animation:"fadeIn 0.5s ease"}}>
              <span style={{fontSize:13, color:"#555", fontFamily:"monospace", lineHeight:1.5}}>{digest}</span>
            </div>
          )}
        </header>

        <div style={{padding:"16px 0", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #111"}}>
          <span style={{fontSize:10, color:"#2a2a2a", fontFamily:"monospace", letterSpacing:1}}>
            {scanned && !loading ? `${trends.length} SIGNALS · ${time}s` : ""}
          </span>
          <button onClick={scan} disabled={loading}
            style={{
              background: loading ? "transparent" : "#fff",
              color: loading ? "#444" : "#000",
              border: loading ? "1px solid #222" : "1px solid #fff",
              padding:"9px 20px", fontSize:10, fontWeight:900, letterSpacing:2,
              textTransform:"uppercase", cursor: loading ? "not-allowed" : "pointer",
              fontFamily:"monospace", display:"flex", alignItems:"center", gap:8,
              transition:"all 0.2s ease",
            }}>
            {loading ? <><Spinner /> SCANNING...</> : scanned ? "↺ REFRESH" : "⚡ SCAN NOW"}
          </button>
        </div>

        <main style={{paddingBottom:80}}>
          {!scanned && !loading && <IdleScreen />}
          {loading && trends.length === 0 && (
            <div style={{paddingTop:2}}>
              {[...Array(6)].map((_,i) => (
                <div key={i} style={{borderBottom:"1px solid #111", padding:"20px 24px", opacity:1 - i*0.14, animation:`fadeIn 0.3s ease ${i*0.08}s both`}}>
                  <div style={{display:"flex", gap:8, marginBottom:10}}>
                    <div style={{width:20, height:8, background:"#141414", borderRadius:1}}/>
                    <div style={{width:50, height:8, background:"#141414", borderRadius:1}}/>
                  </div>
                  <div style={{width:`${68 - i*6}%`, height:18, background:"#111", borderRadius:1}}/>
                </div>
              ))}
            </div>
          )}
          {trends.length > 0 && (
            <div style={{animation:"fadeIn 0.4s ease"}}>
              {trends.map((item, i) => (
                <TrendCard key={item.headline + i} item={item} index={i} />
              ))}
            </div>
          )}
        </main>

        <footer style={{borderTop:"1px solid #111", padding:"18px 0", display:"flex", justifyContent:"space-between"}}>
          <span style={{fontSize:9, color:"#1e1e1e", fontFamily:"monospace", letterSpacing:1.5, textTransform:"uppercase"}}>Design Signal v1.0</span>
          <span style={{fontSize:9, color:"#1e1e1e", fontFamily:"monospace", letterSpacing:1.5, textTransform:"uppercase"}}>Claude + Web Search</span>
        </footer>
      </div>
    </div>
  );
}
