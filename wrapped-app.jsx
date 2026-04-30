// wrapped-app.jsx — Production Wrapped landing page.
//
// Reads encoded payload from URL fragment (location.hash), decodes,
// renders the prompt → carousel → share flow.
//
// Privacy: All identifying data lives in the URL fragment, which is never
// sent to the server, never logged, never sent in referrer headers.
//
// Payload format (base64url-encoded JSON):
//   { n: firstName, c: country (no|da), x: notes }

const MD = {
  ink: "#1E1C19", paper: "#FFF", parchment: "#F6F6F3",
  mute: "#CAC9BE", graphite: "#818076", red: "#C2342B", redInk: "#8C1F18",
};

const VALID_COUNTRIES = ["no", "da"];

// ─────────────────────────────────────────────────────────────
// Anonymous input logging — Google Sheets webhook.
// Fires once per session when the user submits the minutes prompt.
// Stores ONLY {timestamp, minutes, country}. No name, no notes count, no PII.
// Fire-and-forget: never blocks the UX, never surfaces errors to the user.
// ─────────────────────────────────────────────────────────────
const INPUT_LOG_URL = "https://script.google.com/macros/s/AKfycbyD3bDmYlCbLu7htREjR41OBaAxrWpXNwKJIygbLfbLCIaq3MoMhc9LCUezdj5H-FWKQA/exec";

function logMinutesInput(minutes, country) {
  try {
    // Use text/plain to avoid CORS preflight — Apps Script reads the raw body
    // either way. Fire-and-forget; we don't await or read the response.
    fetch(INPUT_LOG_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ minutes, country }),
      keepalive: true,
    }).catch(() => {});
  } catch (_) { /* swallow */ }
}

// ─────────────────────────────────────────────────────────────
// Hash decoder. Base64url → JSON. Returns null if invalid.
// ─────────────────────────────────────────────────────────────
function decodePayload(hash) {
  if (!hash || hash.length < 2) return null;
  try {
    let b64 = hash.replace(/^#/, "").replace(/-/g, "+").replace(/_/g, "/");
    // Re-pad
    while (b64.length % 4) b64 += "=";
    const json = decodeURIComponent(escape(atob(b64)));
    const obj = JSON.parse(json);
    // Normalise country code: uppercase + DK → da, anything unknown → no
    const rawC = typeof obj.c === "string" ? obj.c.toLowerCase() : "";
    const country = rawC === "da" || rawC === "dk" ? "da" : "no";
    // Validate required fields (country always falls back to "no", so not gated)
    const ok = obj
      && typeof obj.n === "string" && obj.n.length > 0 && obj.n.length < 80
      && Number.isFinite(obj.x) && obj.x >= 0 && obj.x < 100000;
    if (!ok) return null;
    return {
      firstName: obj.n,
      country,
      notes: Math.round(obj.x),
    };
  } catch (_) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Localised UI chrome (NO + DA only)
// ─────────────────────────────────────────────────────────────
const UI = {
  no: {
    period: "1. mai 2026",
    swipeHint: "Sveip →",
    // Prompt
    promptEyebrow: "Før vi viser deg tallene",
    promptTitle: "Hvor mange minutter sparer du per notat?",
    promptSub: "Vi bruker svaret til å regne ut hvor mange timer Noteless har gitt deg tilbake i år. Du kan endre det senere.",
    promptHint: "Velg en — eller skriv ditt eget.",
    promptCta: "Se min Wrapped",
    promptCustom: "Annet",
    promptUnit: "min",
    // End
    endTitle: "Takk for året, {name}.",
    endSub: "Del en del av det med kolleger på 1. mai.",
    replay: "Spill av igjen",
    share: "Del",
    chooseCard: "Velg kortet du vil dele",
    // Share
    shareTitle: "Del på 1. mai",
    shareSub: "Bildet eksporteres i 1080×1080 — klart for sosiale medier.",
    shareNative: "Del",
    shareNativeSub: "Åpne delemenyen for Instagram, WhatsApp, Mail …",
    shareFB: "Del på Facebook",
    shareDone: "Lukk",
    sharePreparing: "Forbereder bilde …",
    shareError: "Klarte ikke å forberede bildet. Prøv igjen.",
    shareDownloaded: "Bilde lagret",
    cardLabels: { cover: "Forsiden", notes: "Notater", hours: "Timer", summary: "Oppsummering" },
    // Broken-link fallback
    brokenTitle: "Lenken ser ut til å være ødelagt.",
    brokenBody: "Wrapped-lenken vi sendte deg er personlig og kan se ut som lang og kryptisk. Hvis du kopierte den, sørg for at hele linken kom med — også tegnene etter «#». Eller åpne lenken på nytt fra e-posten.",
    brokenSupport: "Hvis problemet vedvarer, skriv til support.",
    brokenSupportEmail: "support@noteless.no",
  },
  da: {
    period: "1. maj 2026",
    swipeHint: "Stryg →",
    promptEyebrow: "Før vi viser dig tallene",
    promptTitle: "Hvor mange minutter sparer du pr. notat?",
    promptSub: "Vi bruger svaret til at regne ud, hvor mange timer Noteless har givet dig tilbage i år. Du kan ændre det senere.",
    promptHint: "Vælg en — eller skriv din egen.",
    promptCta: "Se min Wrapped",
    promptCustom: "Andet",
    promptUnit: "min",
    endTitle: "Tak for året, {name}.",
    endSub: "Del et stykke af det med kolleger på 1. maj.",
    replay: "Afspil igen",
    share: "Del",
    chooseCard: "Vælg det kort, du vil dele",
    shareTitle: "Del 1. maj",
    shareSub: "Billedet eksporteres i 1080×1080 — klar til sociale medier.",
    shareNative: "Del",
    shareNativeSub: "Åbn delemenuen til Instagram, WhatsApp, Mail …",
    shareFB: "Del på Facebook",
    shareDone: "Luk",
    sharePreparing: "Forbereder billede …",
    shareError: "Kunne ikke forberede billedet. Prøv igen.",
    shareDownloaded: "Billede gemt",
    cardLabels: { cover: "Forsiden", notes: "Noter", hours: "Timer", summary: "Opsummering" },
    brokenTitle: "Linket ser ud til at være ødelagt.",
    brokenBody: "Wrapped-linket vi sendte dig er personligt og kan se langt og kryptisk ud. Hvis du kopierede det, så tjek at hele linket kom med — også tegnene efter «#». Eller åbn linket forfra fra e-mailen.",
    brokenSupport: "Hvis problemet bliver ved, skriv til support.",
    brokenSupportEmail: "support@noteless.dk",
  },
};

const fmt = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// ─────────────────────────────────────────────────────────────
// Broken-link screen
// ─────────────────────────────────────────────────────────────
function BrokenLinkScreen({ ui }) {
  return (
    <div style={{
      minHeight: "100vh", background: MD.parchment, color: MD.ink,
      fontFamily: '"Untitled Sans", -apple-system, system-ui',
      padding: "60px 24px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: MD.graphite, marginBottom: 32 }}>
        <span style={{ width: 6, height: 6, background: MD.red, borderRadius: 99 }} />
        NOTELESS · WRAPPED
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 18, textWrap: "pretty" }}>
        {ui.brokenTitle}
      </div>
      <div style={{ fontSize: 15, color: MD.graphite, lineHeight: 1.55, marginBottom: 24 }}>
        {ui.brokenBody}
      </div>
      <div style={{ fontSize: 14, color: MD.ink, lineHeight: 1.5 }}>
        {ui.brokenSupport}{" "}
        <a href={`mailto:${ui.brokenSupportEmail}`} style={{ color: MD.red, textDecoration: "underline" }}>
          {ui.brokenSupportEmail}
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Prompt screen — minutes-per-note input
// ─────────────────────────────────────────────────────────────
function PromptScreen({ ui, value, onChange, onContinue }) {
  const t = ui;
  const presets = [1, 3, 5];
  const [custom, setCustom] = React.useState(presets.includes(value) ? "" : String(value));
  const isPreset = presets.includes(value);
  return (
    <div style={{
      minHeight: "100vh", background: MD.parchment, color: MD.ink,
      fontFamily: '"Untitled Sans", -apple-system, system-ui',
      padding: "60px 22px 40px", display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto", boxSizing: "border-box",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6, fontSize: 10,
        letterSpacing: "0.08em", textTransform: "uppercase", color: MD.graphite,
      }}>
        <span style={{ width: 6, height: 6, background: MD.red, borderRadius: 99 }} />
        NOTELESS · WRAPPED
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 24, paddingBottom: 24 }}>
        <div style={{ fontSize: 11, color: MD.red, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
          {t.promptEyebrow}
        </div>
        <div style={{ fontSize: 32, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 14, textWrap: "pretty" }}>
          {t.promptTitle}
        </div>
        <div style={{ fontSize: 15, color: MD.graphite, lineHeight: 1.5, marginBottom: 32, maxWidth: 360 }}>
          {t.promptSub}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {presets.map((n) => {
            const selected = isPreset && value === n;
            return (
              <button key={n}
                onClick={() => { onChange(n); setCustom(""); }}
                style={{
                  flex: 1, padding: "20px 8px", borderRadius: 12,
                  background: selected ? MD.ink : MD.paper,
                  color: selected ? MD.paper : MD.ink,
                  border: `1px solid ${selected ? MD.ink : MD.mute}`,
                  fontSize: 18, fontWeight: 500,
                  fontFamily: "inherit", cursor: "pointer",
                  transition: "background 150ms, color 150ms",
                  fontFeatureSettings: '"tnum"',
                }}>
                {n} {t.promptUnit}
              </button>
            );
          })}
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
          border: `1px solid ${!isPreset && value > 0 ? MD.ink : MD.mute}`,
          borderRadius: 12, background: MD.paper,
        }}>
          <span style={{ fontSize: 12, color: MD.graphite, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {t.promptCustom}
          </span>
          <input
            type="number" inputMode="numeric" min="1" max="30"
            value={custom}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value;
              setCustom(raw);
              const n = parseInt(raw, 10);
              if (!isNaN(n) && n > 0 && n <= 30) onChange(n);
            }}
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: 18, fontFamily: "inherit", color: MD.ink,
              fontFeatureSettings: '"tnum"', textAlign: "right",
            }}
          />
          <span style={{ fontSize: 14, color: MD.graphite }}>{t.promptUnit}</span>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: MD.graphite, letterSpacing: "0.02em" }}>
          {t.promptHint}
        </div>
      </div>

      <button onClick={onContinue} disabled={!(value > 0)} style={{
        width: "100%", padding: "20px 24px", borderRadius: 14,
        background: value > 0 ? MD.red : MD.mute, color: MD.paper, border: "none",
        fontSize: 17, fontWeight: 500, letterSpacing: "0.01em",
        fontFamily: '"Untitled Sans", -apple-system, system-ui',
        boxShadow: value > 0 ? "0 6px 16px rgba(194,52,43,0.28)" : "none",
        cursor: value > 0 ? "pointer" : "default", transition: "all 200ms",
      }}>
        {t.promptCta} →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Carousel — wraps the existing MayDaySet, scaled to fit phone width.
// ─────────────────────────────────────────────────────────────
function Carousel({ data, locale, ui, onComplete, onShare }) {
  const [idx, setIdx] = React.useState(0);
  const t = ui;
  const cards = window.MayDaySet({
    data, copy: window.COPY_DATA[locale], formatNumber: window.formatNumber, locale,
  });
  const total = cards.length;

  // Card scales to fill the viewport width (less small horizontal padding).
  // Measure the container so it works inside the iOS frame, on a real phone,
  // or in any responsive shell.
  const stageRef = React.useRef(null);
  const [cardSize, setCardSize] = React.useState(350);
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      // Pad 8px each side, hard cap at 1080 (the native card size)
      const w = Math.min(1080, Math.max(280, el.clientWidth - 16));
      setCardSize(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const scale = cardSize / 1080;

  const goNext = () => {
    if (idx < total - 1) setIdx(idx + 1);
    // On the last card, tapping forward stays put — the prominent
    // Del button is the obvious next action.
  };
  const goPrev = () => idx > 0 && setIdx(idx - 1);

  // Touch handling
  const startX = React.useRef(null);
  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40) goNext();
    else if (dx > 40) goPrev();
    startX.current = null;
  };

  return (
    <div
      ref={stageRef}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        // Tap right half = next, left third = prev
        const x = e.nativeEvent.offsetX || 0;
        const w = e.currentTarget.clientWidth;
        if (x < w * 0.33) goPrev(); else goNext();
      }}
      style={{
        position: "fixed", inset: 0, background: MD.parchment,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center",
        paddingTop: 80, paddingBottom: 130,
        userSelect: "none", cursor: "pointer",
      }}>
      {/* Progress dots — story-style */}
      <div style={{
        position: "absolute", top: 60, left: 16, right: 16,
        display: "flex", gap: 4, zIndex: 5,
      }}>
        {cards.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < idx ? MD.ink : (i === idx ? MD.red : "rgba(30,28,25,0.18)"),
            transition: "background 200ms",
          }} />
        ))}
      </div>

      {/* Close (×) */}
      <div style={{
        position: "absolute", top: 56, right: 16, width: 32, height: 32,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: MD.graphite, fontSize: 20, zIndex: 6,
      }}
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
      >×</div>

      {/* Card stage */}
      <div style={{
        width: cardSize, height: cardSize,
        position: "relative",
      }}>
        {/* Render the active card scaled */}
        <div style={{
          width: 1080, height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute", top: 0, left: 0,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        }}>
          {cards[idx]}
        </div>
      </div>

      {/* Hint */}
      <div style={{
        position: "absolute", bottom: 110, left: 0, right: 0, textAlign: "center",
        color: MD.graphite, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
        {idx === 0 ? t.swipeHint : `${idx + 1} / ${total}`}
      </div>

      {/* Share button — centered, prominent */}
      <div
        onClick={(e) => { e.stopPropagation(); onShare(idx); }}
        style={{
          position: "absolute", bottom: 48, left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 22px", borderRadius: 99,
          background: MD.ink, color: MD.paper,
          fontSize: 15, letterSpacing: "0.02em", fontWeight: 500,
          boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
          cursor: "pointer", zIndex: 6,
          display: "flex", alignItems: "center", gap: 12,
        }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 17 }}>↗</span>
          <span>{t.share}</span>
        </span>
        <span style={{ width: 1, height: 16, background: "rgba(255,255,255,0.22)" }} />
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SocialGlyph kind="ig" />
          <SocialGlyph kind="fb" />
          <SocialGlyph kind="msgr" />
          <SocialGlyph kind="wa" />
          <SocialGlyph kind="li" />
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Share modal — bottom sheet
//
// Real flow:
//   1. On open, render chosen card OFF-SCREEN at full 1080×1080 and convert
//      to PNG with html-to-image. The PNG is cached on first generation.
//   2. Primary "Share" button → navigator.share({files:[png]}) on mobile;
//      falls back to a file download on desktop / browsers without files
//      support.
//   3. "Share on Facebook" → opens the FB sharer URL with the page URL.
//      FB scrapes the page's <meta og:image> for the link preview.
// ─────────────────────────────────────────────────────────────
// Builds the caption that goes into the native share sheet's `text:` field.
// Most apps (Twitter, LinkedIn, WhatsApp, Mail, Messages) prefill this as
// the post body. The hashtag is the message; the stat is supporting.
//
// Per-card variants so the caption reinforces the chosen image. Numbers are
// formatted with the locale-aware separator.
function buildShareCaption({ locale, cardKey, data }) {
  const fmt = window.formatNumber || ((n) => String(n));
  const tag = locale === "da" ? "#AftenerneTilbage" : "#KveldeneTilbake";
  const period = locale === "da" ? "1. maj 2026" : "1. mai 2026";
  const titleNo = "Mitt år med Noteless";
  const titleDa = "Mit år med Noteless";

  if (locale === "da") {
    if (cardKey === "notes")
      return `${titleDa}\n${fmt(data.notes, locale)} noter på et år. Tak til alle, der bærer journalen.\n\n${tag} · ${period}`;
    if (cardKey === "hours")
      return `${titleDa}\n${fmt(data.hours, locale)} timer frigjort til pasienterne — og til mig selv.\n\n${tag} · ${period}`;
    if (cardKey === "summary")
      return `${titleDa}\n${fmt(data.notes, locale)} noter. ${fmt(data.hours, locale)} timer frigjort. Et år med mere overskud.\n\n${tag} · ${period}`;
    // cover
    return `${titleDa} · 1. maj.\n\n${tag}`;
  }

  // Norwegian (default)
  if (cardKey === "notes")
    return `${titleNo}\n${fmt(data.notes, locale)} notater på ett år. Takk til alle som bærer journalen.\n\n${tag} · ${period}`;
  if (cardKey === "hours")
    return `${titleNo}\n${fmt(data.hours, locale)} timer frigjort til pasientene — og til meg selv.\n\n${tag} · ${period}`;
  if (cardKey === "summary")
    return `${titleNo}\n${fmt(data.notes, locale)} notater. ${fmt(data.hours, locale)} timer frigjort. Et år med mer overskudd.\n\n${tag} · ${period}`;
  // cover
  return `${titleNo} · 1. mai.\n\n${tag}`;
}

// ShareEngine — headless. Always mounted while the carousel is visible so
// the off-screen 1080×1080 render targets exist before the user taps Del.
// We expose imperative .share(idx) via React.forwardRef + useImperativeHandle
// so the Carousel's Del button can fire navigator.share() inside the same
// user-gesture chain (iOS Safari requires this).
const ShareEngine = React.forwardRef(function ShareEngine({ data, locale, ui }, ref) {
  const [toast, setToast] = React.useState(null);
  const offscreenRefs = React.useRef([null, null, null, null]);
  const pngCacheRef = React.useRef({}); // { [cardIdx]: { blob, dataUrl } }
  const t = ui;
  const cardKeys = ["cover", "notes", "hours", "summary"];

  const cards = React.useMemo(() => (
    window.MayDaySet({
      data, copy: window.COPY_DATA[locale], formatNumber: window.formatNumber, locale,
    })
  ), [locale, data]);

  // Reset cache when locale or data identity changes
  React.useEffect(() => { pngCacheRef.current = {}; }, [locale, data.firstName, data.notes, data.hours, data.specialty]);

  const showToast = (label) => {
    setToast(label);
    setTimeout(() => setToast(null), 1600);
  };

  // Render a card to PNG. Cached so subsequent shares of the same card are
  // instant. Called inside the user-gesture chain from the Carousel's Del
  // button \u2014 the await is short enough that iOS Safari accepts the
  // subsequent navigator.share() call as a continuation of the gesture.
  const ensurePng = async (idx) => {
    if (pngCacheRef.current[idx]) return pngCacheRef.current[idx];
    const node = offscreenRefs.current[idx];
    if (!node || !window.htmlToImage) {
      throw new Error("html-to-image not loaded");
    }
    const dataUrl = await window.htmlToImage.toPng(node, {
      width: 1080, height: 1080, pixelRatio: 1,
      cacheBust: true,
      backgroundColor: "#FFFFFF",
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const cached = { blob, dataUrl };
    pngCacheRef.current[idx] = cached;
    return cached;
  };

  // Imperative API exposed to the Carousel via ref. The Carousel calls
  // engineRef.current.share(idx) inside the Del button's onClick \u2014 we
  // generate (or read from cache) the PNG and call navigator.share().
  React.useImperativeHandle(ref, () => ({
    async share(idx) {
      const cardKey = cardKeys[idx ?? 0];
      try {
        const { blob, dataUrl } = await ensurePng(idx ?? 0);
        const filename = `noteless-wrapped-${data.firstName}-${cardKey}.png`;
        const file = new File([blob], filename, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          const caption = buildShareCaption({ locale, cardKey, data });
          await navigator.share({
            files: [file],
            text: caption,
          });
        } else {
          // Desktop fallback \u2014 download the PNG and copy caption to clipboard.
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          try {
            await navigator.clipboard.writeText(buildShareCaption({ locale, cardKey, data }));
          } catch {}
          showToast(t.shareDownloaded);
        }
      } catch (err) {
        if (err && err.name !== "AbortError") {
          console.warn("share failed", err);
          showToast(t.shareError);
        }
      }
    },
  }), [locale, data, ui]);

  return (
    <>
      {/* Off-screen render targets \u2014 one per card, full 1080\u00d71080. Always\n          mounted so the DOM is ready the instant the user taps Del. */}
      <div style={{
        position: "fixed", left: -99999, top: 0, width: 1080, height: 1080 * 4,
        pointerEvents: "none", opacity: 0,
      }} aria-hidden="true">
        {cards.map((card, i) => (
          <div key={i} ref={(el) => (offscreenRefs.current[i] = el)} style={{ width: 1080, height: 1080 }}>
            {card}
          </div>
        ))}
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 120, left: "50%", transform: "translateX(-50%)",
          background: MD.ink, color: MD.paper, padding: "10px 18px",
          borderRadius: 99, fontSize: 13, fontFamily: '"Untitled Sans", system-ui',
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)", zIndex: 200,
          animation: "toastIn 200ms ease-out",
        }}>{toast}</div>
      )}
    </>
  );
});

const shareBtnStyle = (bg, fg, outline) => ({
  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  width: "100%", padding: "16px", borderRadius: 12,
  background: bg, color: fg,
  border: outline ? `1px solid ${MD.ink}` : "none",
  fontSize: 15, fontWeight: 500, letterSpacing: "0.01em",
  fontFamily: '"Untitled Sans", -apple-system, system-ui',
  cursor: "pointer",
});

// Small monochrome social glyphs — used on the share CTA to remind users
// where this image will land. White on ink, ~14px.
function SocialGlyph({ kind, color = "#fff", size = 14 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: color };
  if (kind === "ig") return (
    <svg {...common} aria-label="Instagram"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 2a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM18 6a1 1 0 100 2 1 1 0 000-2z"/></svg>
  );
  if (kind === "fb") return (
    <svg {...common} aria-label="Facebook"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.6-1.5h1.5V5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9V11H8v3h2.5v7h3z"/></svg>
  );
  if (kind === "msgr") return (
    <svg {...common} aria-label="Messenger"><path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.88 1.42 5.43 3.65 7.13V22l3.34-1.83c.97.27 2 .42 3.01.42 5.52 0 10-4.14 10-9.34S17.52 2 12 2zm1.05 12.6L10.5 11.9l-4.95 2.7 5.45-5.78 2.6 2.7 4.9-2.7-5.45 5.78z"/></svg>
  );
  if (kind === "wa") return (
    <svg {...common} aria-label="WhatsApp"><path d="M12 2a10 10 0 00-8.6 15.06L2 22l5.06-1.32A10 10 0 1012 2zm0 18a8 8 0 01-4.07-1.11l-.29-.17-3 .79.8-2.93-.19-.3A8 8 0 1112 20zm4.4-5.96c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.55.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.32-.75-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/></svg>
  );
  if (kind === "li") return (
    <svg {...common} aria-label="LinkedIn"><path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8h4.56v14H.22V8zM7.85 8h4.37v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 6.99V22h-4.56v-6.55c0-1.56-.03-3.57-2.18-3.57-2.18 0-2.51 1.7-2.51 3.46V22H7.85V8z"/></svg>
  );
  return null;
}

function ShareIcon({ kind, color = "#fff" }) {
  if (kind === "share") return (
    // iOS-style share glyph — square with up-arrow
    <svg width="18" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v13M12 3l-4 4M12 3l4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 11v9a1 1 0 001 1h12a1 1 0 001-1v-9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (kind === "fb") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.2c0-.9.3-1.5 1.6-1.5h1.5V5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9V11H8v3h2.5v7h3z"/>
    </svg>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────
// App shell
// ─────────────────────────────────────────────────────────────
function WrappedApp() {
  // Hide boot loader once we've mounted (one render is proof React is alive)
  React.useEffect(() => {
    const boot = document.getElementById("boot");
    if (!boot) return;
    boot.classList.add("fade");
    const t = setTimeout(() => boot.remove(), 300);
    return () => clearTimeout(t);
  }, []);

  // Decode payload from URL fragment
  const payload = React.useMemo(
    () => decodePayload(typeof window !== "undefined" ? window.location.hash : ""),
    []
  );

  // Locale: from payload, or fall back to NO for the broken-link screen
  const locale = (payload && payload.country) || "no";
  const ui = UI[locale];

  // Hooks must run unconditionally — declare state regardless of payload
  const [screen, setScreen] = React.useState("prompt");
  const [minutesPerNote, setMinutesPerNote] = React.useState(3);
  // Imperative ref to the always-mounted ShareEngine so the carousel's Del
  // button can call .share(idx) inside the user-gesture chain.
  const shareEngineRef = React.useRef(null);

  if (!payload) return <BrokenLinkScreen ui={ui} />;

  const computedHours = Math.round((payload.notes * minutesPerNote) / 60);
  const data = {
    firstName: payload.firstName,
    period: ui.period,
    notes: payload.notes,
    consults: payload.notes,
    hours: computedHours,
    minutesPerNote,
  };

  return (
    <>
      {screen === "prompt" && (
        <PromptScreen ui={ui} value={minutesPerNote}
          onChange={setMinutesPerNote}
          onContinue={() => {
            logMinutesInput(minutesPerNote, locale);
            setScreen("carousel");
          }} />
      )}
      {screen === "carousel" && (
        <Carousel data={data} locale={locale} ui={ui}
          onComplete={() => {}}
          onShare={(idx) => shareEngineRef.current && shareEngineRef.current.share(idx)} />
      )}
      {screen === "carousel" && (
        <ShareEngine ref={shareEngineRef} data={data} locale={locale} ui={ui} />
      )}
    </>
  );
}

window.WrappedApp = WrappedApp;
window.decodePayload = decodePayload;
