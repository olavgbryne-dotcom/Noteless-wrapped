// May Day variant — 1st of May, Workers' Day.
// Theme: solidarity, recognition of the practitioner's labour, "the work behind the work."
// Palette: Paper / Ink with a single warm signal red used sparingly (red flag, red carnation —
// historic May Day symbols), paired with the existing Noteless palette so it still reads as a
// product comm, not a political poster. Every card carries an "01.05" date stamp.
//
// 4-card set (tightened to the metrics that matter on May Day):
//   1. Cover     ·  "A note for May Day"
//   2. Consults  ·  number + dot field — consultations Noteless was present in
//   3. Hours     ·  number + arc — hours returned to patient care
//   4. Comparison · top-percentile vs. specialty AVERAGE

const MD = {
  ink: "#1E1C19", paper: "#FFFFFF", parchment: "#F6F6F3",
  mute: "#CAC9BE", graphite: "#818076", blue: "#026E8E",
  // Signal red — chosen to sit comfortably with Noteless Blue and Ink without
  // hijacking the brand. Used as ACCENT only (≤ ~8% of card area), never ground.
  red: "#C2342B",
  redInk: "#7A1F19",
};
const MFONT = `"Untitled Sans","Helvetica Neue",Helvetica,Arial,sans-serif`;
const MSAFE_TOP = 257;

const mBase = {
  width: 1080, height: 1080, position: "relative",
  fontFamily: MFONT, WebkitFontSmoothing: "antialiased",
  overflow: "hidden", color: MD.ink, background: MD.paper,
};

// Small carnation glyph — historical May Day symbol. Drawn in SVG, used as
// a subtle accent (top-left of period stamp). Two overlapping fans of petals.
function Carnation({ size = 24, color = MD.red }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill={color}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4 C 10 6, 10 8, 12 9 C 14 8, 14 6, 12 4 Z" />
        <path d="M20 12 C 18 10, 16 10, 15 12 C 16 14, 18 14, 20 12 Z" />
        <path d="M12 20 C 14 18, 14 16, 12 15 C 10 16, 10 18, 12 20 Z" />
        <path d="M4 12 C 6 14, 8 14, 9 12 C 8 10, 6 10, 4 12 Z" />
        <path d="M6 6 C 8 6, 9 7, 9 9 C 7 9, 6 8, 6 6 Z" />
        <path d="M18 6 C 16 6, 15 7, 15 9 C 17 9, 18 8, 18 6 Z" />
        <path d="M6 18 C 8 18, 9 17, 9 15 C 7 15, 6 16, 6 18 Z" />
        <path d="M18 18 C 16 18, 15 17, 15 15 C 17 15, 18 16, 18 18 Z" />
      </g>
    </svg>
  );
}

function MChrome({ period, copy, mayday, dark = false }) {
  const c = dark ? "#FFFFFF" : MD.ink;
  const wm = dark ? "assets/wordmark-light.svg" : "assets/wordmark-dark.svg";
  return (
    <div style={{
      position: "absolute", left: 56, right: 56, top: 56,
      display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: c,
    }}>
      <img src={wm} width={189} height={23.251} alt="Noteless" />
      <div style={{ textAlign: "right", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Carnation size={22} color={dark ? "#FF6A60" : MD.red} />
        <div style={{
          fontSize: 14, lineHeight: 1.35, letterSpacing: "0.04em",
          textTransform: "uppercase", color: c,
        }}>
          {mayday.occasion}<br/>
          <span style={{ color: dark ? "rgba(255,255,255,.55)" : MD.graphite }}>{copy.wrappedTitle} · {period}</span>
        </div>
      </div>
    </div>
  );
}

function MFoot({ copy, dark = false }) {
  const c = dark ? "#FFFFFF" : MD.ink;
  const muted = dark ? "rgba(255,255,255,.55)" : MD.graphite;
  return (
    <div style={{
      position: "absolute", left: 56, right: 56, bottom: 56,
      display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: c,
    }}>
      <div style={{ fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase", color: muted }}>
        {copy.signoffSub}
      </div>
      <div style={{ fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        noteless.com
      </div>
    </div>
  );
}

// Locale → brand promise hashtag. (Currently unused on cards — reserved
// for share-modal copy. Keep here so we don't lose the strings.)
const HASHTAG = {
  no: "#FåKveldeneTilbake",
  da: "#FåAftenerneTilbage",
  en: "#GetYourEveningsBack",
  de: "#HolDirDeineAbendeZurück",
  fr: "#RetrouvezVosSoirées",
  it: "#RiprenditiLeTueSerate",
  es: "#RecuperaTusTardes",
  nl: "#PakJeAvondenTerug",
};


// 1 — Cover. Headline in Ink; "May Day" stamped in red below the wordmark.
function MCover({ firstName, period, copy, mayday }) {
  return (
    <div style={mBase} data-card="cover">
      <MChrome period={period} copy={copy} mayday={mayday} />
      <div style={{ position: "absolute", left: 56, right: 56, top: MSAFE_TOP, bottom: 257 }}>
        <div style={{ fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase", color: MD.red }}>
          {mayday.coverEyebrow}
        </div>
        <div style={{
          marginTop: 32, fontSize: 92, lineHeight: 0.92, letterSpacing: "-0.02em",
          color: MD.ink, maxWidth: 920, fontWeight: 400,
        }}>
          {mayday.coverHeadline(firstName)}
        </div>
      </div>
      {/* Red ribbon stripe along the bottom edge — workers' banner motif */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 28, background: MD.red,
      }} />
      <MFoot copy={copy} />
    </div>
  );
}


// 3 — Hours. Just the number, large, sitting low — matches QuietData.
// Number gets a small "t" suffix (Norwegian abbreviation for "timer" / hours).
function MHours({ value, period, copy, mayday, formatNumber, locale, consults }) {
  const formatted = formatNumber(value, locale);
  const numSize = formatted.length <= 4 ? 280 : 220;
  return (
    <div style={mBase} data-card="hours">
      <MChrome period={period} copy={copy} mayday={mayday} />
      <div style={{ position: "absolute", left: 56, right: 56, top: MSAFE_TOP, bottom: 257 }}>
        <div style={{ fontSize: 30, lineHeight: 1.15, color: MD.ink, maxWidth: 760 }}>
          {mayday.hoursLabel}
        </div>
        <div style={{
          position: "absolute", left: 0, right: 0, top: "62%", transform: "translateY(-50%)",
          color: MD.ink, fontFeatureSettings: '"tnum"',
          display: "flex", alignItems: "baseline",
        }}>
          <span style={{ fontSize: numSize, lineHeight: 0.85, letterSpacing: "-0.025em" }}>
            {formatted}
          </span>
          <span style={{
            fontSize: numSize, lineHeight: 0.85,
            letterSpacing: "-0.025em", color: MD.ink, marginLeft: 4,
          }}>
            t
          </span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 130, fontSize: 18, color: MD.graphite, maxWidth: 720 }}>
        {mayday.hoursContext}
      </div>
      <MFoot copy={copy} />
    </div>
  );
}

// 2 — Notes. Just the number, large, sitting low — matches QuietData.
//      Sourced from Customer.io attribute `notes_generated_2026`.
function MConsults({ value, period, copy, mayday, formatNumber, locale }) {
  const formatted = formatNumber(value, locale);
  const numSize = formatted.length <= 5 ? 280 : 220;
  return (
    <div style={mBase} data-card="notes">
      <MChrome period={period} copy={copy} mayday={mayday} />
      <div style={{ position: "absolute", left: 56, right: 56, top: MSAFE_TOP, bottom: 257 }}>
        <div style={{ fontSize: 30, lineHeight: 1.15, color: MD.ink, maxWidth: 820 }}>
          {mayday.notesLabel}
        </div>
        <div style={{
          position: "absolute", left: 0, right: 0, top: "62%", transform: "translateY(-50%)",
          fontSize: numSize, lineHeight: 0.85, letterSpacing: "-0.025em",
          color: MD.ink, fontFeatureSettings: '"tnum"',
        }}>
          {formatted}
        </div>
      </div>
      <div style={{ position: "absolute", left: 56, right: 56, bottom: 130, fontSize: 18, color: MD.graphite, maxWidth: 740 }}>
        {mayday.notesContext}
      </div>
      <MFoot copy={copy} />
    </div>
  );
}


// 4 — Summary. A clean recap of cards 2 (notes) + 3 (hours) on a single surface,
// with a quiet emphasis on Workers' Day: a slim red ribbon at the top edge mirroring
// the cover, the date stamp, and a tribute footnote. Same type/spacing rhythm as the
// stat cards — just two stacked figures separated by a thin rule, so the eye reads
// it as a closing summary, not a new metric.
function MSummary({ data, period, copy, mayday, formatNumber, locale }) {
  const notesFmt = formatNumber(data.notes, locale);
  const hoursFmt = formatNumber(data.hours, locale);
  // Slightly smaller than the single-stat cards — they share a slide here.
  const numSize = 168;
  const tSize = numSize;
  return (
    <div style={mBase} data-card="summary">
      {/* Top red ribbon — echoes the cover, ties the set together */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: 6, background: MD.red,
      }} />
      <MChrome period={period} copy={copy} mayday={mayday} />
      <div style={{ position: "absolute", left: 56, right: 56, top: MSAFE_TOP, bottom: 257 }}>
        <div style={{ fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase", color: MD.red }}>
          {mayday.summaryEyebrow}
        </div>
        <div style={{
          marginTop: 24, fontSize: 60, lineHeight: 0.95, letterSpacing: "-0.02em",
          color: MD.ink, maxWidth: 820, fontWeight: 400,
        }}>
          {mayday.summaryTitle}
        </div>

        {/* Two stacked stats — same visual language as the single-stat cards */}
        <div style={{ marginTop: 80 }}>
          {/* Notes */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 28 }}>
            <div style={{ fontSize: 18, color: MD.graphite, letterSpacing: "0.06em", textTransform: "uppercase", maxWidth: 320 }}>
              {mayday.summaryNotesLabel}
            </div>
            <div style={{
              display: "flex", alignItems: "baseline",
              color: MD.ink, fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums",
            }}>
              <span style={{ fontSize: numSize, lineHeight: 0.85, letterSpacing: "-0.025em" }}>
                {notesFmt}
              </span>
            </div>
          </div>
          <div style={{ height: 1, background: MD.mute }} />
          {/* Hours */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 28 }}>
            <div style={{ fontSize: 18, color: MD.graphite, letterSpacing: "0.06em", textTransform: "uppercase", maxWidth: 320 }}>
              {mayday.summaryHoursLabel}
            </div>
            <div style={{
              display: "flex", alignItems: "baseline",
              color: MD.ink, fontFeatureSettings: '"tnum"', fontVariantNumeric: "tabular-nums",
            }}>
              <span style={{ fontSize: numSize, lineHeight: 0.85, letterSpacing: "-0.025em" }}>
                {hoursFmt}
              </span>
              <span style={{
                fontSize: tSize, lineHeight: 0.85,
                letterSpacing: "-0.02em", color: MD.ink, marginLeft: 4,
              }}>
                t
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet tribute line at the bottom — the workers' day emphasis */}
      <div style={{
        position: "absolute", left: 56, right: 56, bottom: 130,
        fontSize: 18, color: MD.graphite, maxWidth: 720, lineHeight: 1.4, fontStyle: "italic",
      }}>
        {mayday.summaryFootnote}
      </div>
      <MFoot copy={copy} />
    </div>
  );
}


function MayDaySet({ data, copy, formatNumber, locale }) {
  const mayday = window.MAYDAY_COPY[locale] || window.MAYDAY_COPY.en;
  return [
    <MCover    key="c" firstName={data.firstName} period={data.period} copy={copy} mayday={mayday} />,
    <MConsults key="x" value={data.notes}    period={data.period} copy={copy} mayday={mayday} formatNumber={formatNumber} locale={locale} />,
    <MHours    key="h" value={data.hours}    period={data.period} copy={copy} mayday={mayday} formatNumber={formatNumber} locale={locale} consults={data.notes} />,
    <MSummary  key="s" data={data}            period={data.period} copy={copy} mayday={mayday} formatNumber={formatNumber} locale={locale} />,
  ];
}

window.MayDaySet = MayDaySet;
