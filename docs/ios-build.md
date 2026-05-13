# Building FableCode for iOS (iPhone & iPad)

This guide walks through building and distributing the FableCode app natively on iOS using **Capacitor**.

---

## Architecture overview

FableCode was originally an Electron desktop app.  The iOS port keeps the React renderer unchanged and replaces the Electron IPC layer with two components:

| Component | Purpose |
|---|---|
| `src/platform/` | Platform abstraction — returns the Electron IPC bridge on desktop, or an HTTP client on Capacitor/web |
| `server/index.ts` | Companion Express server — exposes Groq AI, file browsing, and debug analysis over HTTP so the iOS app can reach them |

The iOS app talks to the companion server over the local network (same Wi-Fi), Tailscale, or a cloud deployment.  Features that have no mobile equivalent (DJMT toolchain depot, Holograim MCP subprocess) are gracefully hidden.

---

## Prerequisites

- macOS 14 or later with Xcode 16+ installed.
- An Apple Developer account (free account works for Simulator; paid account required for real devices and TestFlight).
- Node.js 20+ and npm.
- The repository cloned and dependencies installed.

---

## Step 1 — Install dependencies

```bash
npm install
```

This installs Capacitor (`@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`) along with the Express server dependencies (`express`, `cors`).

---

## Step 2 — Build the web assets

```bash
npm run build:web
```

This runs `vite build --mode web` which produces an absolute-path bundle in `dist/renderer/` that Capacitor can wrap.  The `--mode web` flag ensures asset paths start with `/` rather than `./` as required by the Capacitor WebView.

---

## Step 3 — Initialise the Capacitor iOS project (first time only)

```bash
npx cap add ios
```

This generates an `ios/` directory containing the Xcode project.  You only need to run this once.  After that, use `cap sync` to update the web assets.

---

## Step 4 — Sync web assets into Xcode

After every `npm run build:web`:

```bash
npm run cap:sync
# or: npx cap sync
```

---

## Step 5 — Open and configure Xcode

```bash
npm run cap:open:ios
# or: npx cap open ios
```

In Xcode:

1. Select the `App` target → **Signing & Capabilities** → choose your Team.
2. Set a unique Bundle Identifier if needed (default: `com.fableharbinger.fablecode`).
3. Build and run on the Simulator first (**Product → Run** or ⌘R).

---

## Step 6 — Configure the backend server URL

The iOS app needs the companion Express server running on a Mac reachable from the device.

### Start the server on your Mac

```bash
# Make sure GROQ_API_KEY is set in .env
npm run server
```

The server starts on `http://localhost:3333`.  To reach it from a physical device, expose it on your LAN:

```bash
PORT=3333 node dist/server/index.js
# or during development:
npx ts-node --project server/tsconfig.json server/index.ts
```

Find your Mac's local IP:

```bash
ifconfig en0 | grep 'inet '
```

### Set the URL in the app

In the FableCode iOS app, look for the **Backend** section in the agent rail (left sidebar) and type the server address, e.g. `http://192.168.1.42:3333`, then tap the ✓ button.  The app reloads and uses the new server.

Alternatively, set the `VITE_BACKEND_URL` environment variable before building:

```bash
VITE_BACKEND_URL=http://192.168.1.42:3333 npm run build:web
npx cap sync
```

---

## Step 7 — Live-reload during development (optional)

For a faster iteration loop, point the Capacitor WebView at your running Vite dev server:

1. Start `npm run dev` (Vite only, not Electron):
   ```bash
   npx vite --host 0.0.0.0
   ```

2. In `capacitor.config.ts`, uncomment and fill the `server.url`:
   ```ts
   server: {
     url: 'http://192.168.x.x:5173',
     cleartext: true
   }
   ```

3. Run `npx cap sync` and rebuild in Xcode.

---

## Step 8 — Test on a physical device

1. Connect your iPhone or iPad via USB.
2. Select the device in Xcode's scheme menu.
3. Build and run (⌘R).

If you see a "developer not trusted" warning on the device, go to **Settings → General → VPN & Device Management** and trust your certificate.

---

## Step 9 — TestFlight and App Store

1. **Archive**: Product → Archive.
2. **Distribute**: Use the Xcode Organiser to upload to App Store Connect.
3. Add the build to **TestFlight** for internal testing.
4. Submit for App Store review when ready.

Required `Info.plist` keys (already scaffolded by Capacitor):

| Key | Reason |
|---|---|
| `NSLocalNetworkUsageDescription` | Connecting to the local Mac backend server |

---

## iOS feature availability

| Feature | Status |
|---|---|
| Groq chat (Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B) | ✅ Via companion server |
| File debug analysis (heuristic scan) | ✅ Runs client-side in the WebView |
| Model-assisted debug review | ✅ Via companion server |
| Grid Sandbox flow builder | ✅ Fully client-side |
| Learn CSS panel | ✅ Fully client-side |
| Workspace file browser | ✅ Browses files on the Mac backend server |
| Session persistence (local) | ✅ Stored in `localStorage` |
| DJMT toolchain depot | ❌ Desktop-only (hidden on iOS) |
| Holograim MCP subprocess | ❌ Desktop-only (hidden on iOS) |
| Conda environment | ❌ Not applicable on iOS |

---

## Networking tips

| Scenario | Solution |
|---|---|
| Same Wi-Fi | Use the Mac's LAN IP (`192.168.x.x:3333`) |
| Different network | Install [Tailscale](https://tailscale.com) on Mac and iPhone, use the Tailscale IP |
| Cloud deployment | Deploy `server/index.ts` to Railway, Render, or a VPS; use HTTPS |
| HTTP not allowed (iOS ATS) | Add the server domain to `NSAppTransportSecurity` in `Info.plist`, or use HTTPS |

### Allowing HTTP to a local server (ATS exception)

Add to `ios/App/App/Info.plist` inside the root `<dict>`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
  <!-- For a cloud HTTP server, add NSExceptionDomains instead -->
</dict>
```
