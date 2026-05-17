# FableCode on iPad — Deploy Playbook

This is the runbook for taking the local web build and putting it on an iPad as
a Progressive Web App (PWA) installed from Safari.

The architecture is two pieces:

```
┌─────────────────────────────┐       ┌──────────────────────────────┐
│  iPad Safari (renderer)     │──────▶│  Companion server (node)     │
│  static, hosted on a CDN    │       │  runs Groq, web search,      │
│  ./dist/renderer/           │       │  workspace files endpoints   │
└─────────────────────────────┘       └──────────────────────────────┘
```

The renderer is a static bundle. The companion server is a stateless Node
process that holds your `GROQ_API_KEY` (and later `ANTHROPIC_API_KEY`).
The two are linked by a single env var at build time: `VITE_BACKEND_URL`.

---

## 1. Deploy the companion server

Anywhere that runs Node 20+ will work. Render and Fly.io both have free tiers.

### Render (simplest)

1. Push this repo to GitHub if it isn't already.
2. Render dashboard → **New → Web Service** → connect the repo.
3. Settings:
   - **Build Command:** `npm install && npm run server:build`
   - **Start Command:** `node dist/server/server/index.js`
   - **Environment:**
     - `GROQ_API_KEY` — your key
     - `ANTHROPIC_API_KEY` — optional, for the future vision endpoint
     - `PORT` — Render injects this automatically, the server reads it
4. Deploy. Note the URL, e.g. `https://fablecode-server.onrender.com`.
5. Smoke test: `curl https://fablecode-server.onrender.com/health` should
   return `{"status":"ok","groqConfigured":true,...}`.

### Fly.io (if you want a persistent VM)

```bash
fly launch --no-deploy           # accept defaults, name it fablecode-server
fly secrets set GROQ_API_KEY=...
fly deploy
```

The included `package.json` start scripts work with either host.

---

## 2. Build & deploy the renderer

The renderer needs to know where the server lives. Set `VITE_BACKEND_URL`
to the public URL of the server you just deployed.

### Vercel

```bash
# In the project root:
npm run build:web
# (icons regenerate, then Vite emits dist/renderer/)

# Deploy with Vercel CLI:
npx vercel --prod dist/renderer
```

Then in the Vercel project settings, add an env var:

- `VITE_BACKEND_URL = https://fablecode-server.onrender.com`

…and trigger a redeploy so the bundle bakes the URL in.

### Netlify / Cloudflare Pages

Same idea — point the deploy at `dist/renderer/` and set `VITE_BACKEND_URL`
in the project's environment.

### One-line local preview

Before deploying, you can test the production bundle on your Mac and load
it from the iPad over the LAN:

```bash
npm run build:web
python3 -m http.server 4173 --directory dist/renderer
# iPad Safari → http://<mac-lan-ip>:4173
```

(For this to talk to the server, also start it locally:
`npm run server:build && node dist/server/server/index.js`,
and set `VITE_BACKEND_URL` before the build.)

---

## 3. Install on iPad

1. Open the deployed renderer URL in Safari on the iPad.
2. Tap the **Share** button → **Add to Home Screen**.
3. Confirm the name (it'll prefill as "FableCode").
4. Launch from the home screen — Safari chrome disappears, the app runs
   fullscreen, and the service worker handles the offline shell so subsequent
   launches are instant even on a flaky connection.

---

## 4. What works offline vs. online

| Feature                     | Offline | Online |
|----------------------------|:-------:|:------:|
| App shell launches          | ✅      | ✅     |
| Lesson reading (cached)     | ✅      | ✅     |
| Design Space (Three.js)     | ✅      | ✅     |
| AI chat (Groq)              | ❌      | ✅     |
| Web search                  | ❌      | ✅     |
| Workspace file scan         | ❌      | ✅     |

The renderer never tries to fake AI responses offline — it surfaces the
network error so the user knows to reconnect.

---

## 5. Updating

- **Renderer:** push to the repo branch the CDN watches. Vercel/Netlify
  auto-rebuild and deploy. The service worker version bumps on every deploy
  because Vite emits new hashed asset filenames, so users always get the
  latest code on next launch.
- **Server:** push to the branch Render/Fly watches. Auto-deploy.

To force the iPad to reload the shell (rare), the user can long-press the
home-screen icon, remove it, and re-add from Safari.

---

## 6. Troubleshooting

**Renderer loads but every chat fails.**
Either `VITE_BACKEND_URL` is wrong, the server is sleeping (Render free
tier sleeps after 15 min — first request wakes it, ~30s cold start), or
CORS is rejecting. Check `curl <server>/health` first.

**iPad shows Safari chrome instead of launching fullscreen.**
The user opened the URL directly instead of via the home-screen icon.
Re-add to Home Screen.

**Updates don't appear after deploying.**
Force-quit FableCode on the iPad (swipe up from app switcher), then relaunch.
The service worker's `activate` handler clears the old cache on the next
fresh launch.
