# Noteless · Wrapped — Standalone landing page

Self-contained, static landing page for the personal Wrapped link sent
out from Customer.io on May 1.

## How it works

1. Customer.io email contains a button:
   `https://wrapped.noteless.no/#<base64url>`
2. The hash payload is decoded **client-side only** — never sent to a
   server, never logged, never sent in referrer headers.
3. Page reads `location.hash`, decodes, runs the prompt → carousel →
   share flow.
4. If the hash is missing or malformed, a localised "broken link" screen
   tells the user to re-open from the email.

## Payload format

JSON, base64url-encoded (no padding):

```json
{
  "n": "Astrid",   // first name (string, 1–80 chars)
  "c": "no",       // country: "no" | "da"
  "x": 1247,       // notes count (integer 0–99999)
  "s": "gp"        // specialty: gp|paed|psy|int|gyn|derm|card|oth
}
```

Example payload `{"n":"Astrid","c":"no","x":1247,"s":"gp"}` becomes
`eyJuIjoiQXN0cmlkIiwiYyI6Im5vIiwieCI6MTI0NywicyI6ImdwIn0`.

## Customer.io Liquid snippet

Drop this into the email template that builds the Wrapped button URL.
Adjust source field names (`customer.first_name` etc.) to match your
schema.

```liquid
{% capture wrapped_json %}{"n":"{{ customer.first_name | escape }}","c":"{{ customer.country | downcase }}","x":{{ customer.wrapped_notes_2026 | default: 0 }},"s":"{{ customer.specialty | downcase | default: "oth" }}"}{% endcapture %}
{% assign wrapped_hash = wrapped_json | base64 | replace: "+", "-" | replace: "/", "_" | replace: "=", "" %}

<a href="https://wrapped.noteless.no/#{{ wrapped_hash }}"
   style="…button styles…">
  Se min Wrapped →
</a>
```

Notes:
- `escape` on the first name protects against quotes / control chars
  that would break the JSON.
- The `replace` chain converts standard base64 to base64url (URL-safe
  alphabet, no padding).
- `customer.country` must be `"no"` or `"da"`. Anything else → broken-link
  screen.
- `customer.specialty` must match one of: `gp paed psy int gyn derm card oth`.
  Default to `oth` for safety.

## Deployment

This is a fully static site. Deploy any of these:

- **Vercel / Netlify**: drop the `wrapped-deploy/` folder.
- **Cloudflare Pages**: same.
- **S3 + CloudFront**: upload as static assets.

No build step required. All dependencies (React, Babel, html-to-image)
are loaded from unpkg with integrity hashes pinned.

### Files

```
index.html              — page shell, OG meta, boot loader
wrapped-app.jsx         — main app (decoder, screens, share flow)
copy-runtime.jsx        — NO/DA copy + number formatting
variant-mayday.jsx      — May Day card set (cover, notes, hours, peers)
assets/
  wordmark-dark.svg
  wordmark-light.svg
og-image.png            — TODO: design 1200×630 link-preview image
```

### Production hardening (before launch)

- [ ] **Pre-compile JSX**: replace Babel-standalone with esbuild or Vite
      bundling. Cuts ~700KB of JS and removes the runtime warning.
- [ ] **OG image**: design a generic 1200×630 PNG for `og-image.png`.
      The current meta points to `/og-image.png` — placeholder file.
- [ ] **Domain**: serve from `wrapped.noteless.no` (NO) or
      `wrapped.noteless.dk` (DA). One deploy, two domains, both fine —
      the page reads country from the payload, not the hostname.
- [ ] **Cache headers**: long-cache the JSX/SVG (immutable filenames),
      short-cache `index.html` (5 min) so meta updates ship fast.

### Privacy / security

- All identifying data is in the URL fragment (`#…`). Browsers do **not**
  send fragments in HTTP requests, in `Referer` headers, or to analytics
  beacons by default.
- `<meta name="referrer" content="no-referrer">` ensures no referrer
  leakage when users click outbound links from the page.
- `<meta name="robots" content="noindex,nofollow">` prevents accidental
  indexing of personal Wrapped pages if links leak.
- Server access logs will record only the path, never the fragment.
- The Facebook share button strips the fragment before opening the
  sharer dialog — FB's crawler sees the bare URL and the public OG image,
  not the personal payload.

### Updating cohort averages

`wrapped-app.jsx` → `SPEC_PEERS` is a literal map. To update for a new
year, edit the constants and redeploy. No backend, no DB.

## Local development

Open `index.html` directly in a browser via a static server, e.g.:

```
npx serve wrapped-deploy
```

Then visit:
```
http://localhost:3000/#eyJuIjoiQXN0cmlkIiwiYyI6Im5vIiwieCI6MTI0NywicyI6ImdwIn0
```

To generate test hashes from the JS console:

```js
const payload = { n: "Astrid", c: "no", x: 1247, s: "gp" };
const hash = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
console.log("#" + hash);
```
