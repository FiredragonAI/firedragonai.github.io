// A small Chrome DevTools Protocol driver: starts headless Chrome with a fresh
// profile, opens one page, and lets a script run JavaScript in it and take
// screenshots. No dependencies -- Node 22+ has fetch and WebSocket built in.
//
//   import { withPage } from './cdp.mjs';
//   await withPage({ width: 360, height: 640, scale: 3 }, async (page) => { ... });
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9333);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const pending = new Map();
    const listeners = new Set();
    let id = 0;
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) p.reject(new Error(`${m.error.message} (${p.method})`)); else p.resolve(m.result);
      } else for (const l of listeners) l(m);
    };
    ws.onerror = () => reject(new Error(`cannot connect to ${url}`));
    ws.onopen = () => resolve({
      send: (method, params = {}) => new Promise((res, rej) => {
        const i = ++id;
        pending.set(i, { resolve: res, reject: rej, method });
        ws.send(JSON.stringify({ id: i, method, params }));
      }),
      on: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
      close: () => ws.close(),
    });
  });
}

// `profile` keeps the browser profile (storage, caches) between runs; `args` adds Chrome switches.
export async function withPage({ width = 360, height = 640, scale = 3, mobile = true, dark = false, profile: keep, args = [] } = {}, fn) {
  const profile = keep || mkdtempSync(join(tmpdir(), 'le-cdp-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', ...args, 'about:blank',
  ], { stdio: 'ignore' });
  let cdp;
  try {
    let ready = false;
    for (let i = 0; i < 60 && !ready; i++) {
      try { await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); ready = true; } catch { await sleep(200); }
    }
    if (!ready) throw new Error('Chrome did not start');
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    cdp = await connect(target.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] });

    const page = {
      cdp,
      async goto(url) {
        const loaded = new Promise((res) => { const off = cdp.on((m) => { if (m.method === 'Page.loadEventFired') { off(); res(); } }); });
        await cdp.send('Page.navigate', { url });
        await loaded;
        await sleep(300);
      },
      // Runs before any script of every page loaded from now on.
      async init(source) { await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source }); },
      // Runs an async function body in the page and returns its JSON result.
      async run(body) {
        const r = await cdp.send('Runtime.evaluate', { expression: `(async () => { ${body} })()`, awaitPromise: true, returnByValue: true });
        if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result.value;
      },
      async shot(file) {
        const { data } = await cdp.send('Page.captureScreenshot', { format: file.endsWith('.jpg') ? 'jpeg' : 'png', quality: file.endsWith('.jpg') ? 90 : undefined });
        writeFileSync(file, Buffer.from(data, 'base64'));
      },
      sleep,
    };
    return await fn(page);
  } finally {
    try { cdp?.close(); } catch {}
    chrome.kill();
    await sleep(600);
    if (!keep) { try { rmSync(profile, { recursive: true, force: true }); } catch {} }
  }
}
