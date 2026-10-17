// Layout and touch-target check of the real page, at a small phone size, in
// both themes, both languages, and with the text scaled to 200%.
//
//   (serve this folder on :8771 first)  node tools/check-layout.mjs [outdir]
//
// For every screen it reports horizontal overflow (anything wider than the
// phone) and any visible control smaller than 44×44 CSS px, and saves a
// screenshot so the result can be looked at, not just counted.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { withPage } from './cdp.mjs';
import { BASE, SCENES } from './scenes.mjs';

const out = process.argv[2] || 'layout-check';
mkdirSync(out, { recursive: true });

// Measured in the page: what sticks out sideways, and which visible controls are too small to hit.
const MEASURE = `
  const vw = innerWidth;
  const wide = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' && !e.closest('[hidden]') && !e.closest('.chips, .presets, svg'); }).slice(0, 5).map(e => (e.id || e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().right));
  const small = [...document.querySelectorAll('button, a[href], input, select, textarea, [role=button], summary')].filter(e => {
    if (e.closest('[hidden]') || e.closest('[inert]') || e.type === 'file') return false;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
    if (r.bottom < 0 || r.top > innerHeight) return false;
    if (e.matches('.text, .preview')) return false;               // sentence rows: full-width text
    if (e.matches('input[type=checkbox], input[type=radio]')) { const l = e.closest('label'); if (l) { const lr = l.getBoundingClientRect(); return lr.height < 44; } }
    if (e.matches('a') && e.closest('p')) return false;           // inline text links (WCAG 2.5.8 inline exception)
    return r.width < 44 || r.height < 44;
  }).map(e => (e.id || e.getAttribute('aria-label') || e.textContent.trim().slice(0, 20) || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  return { scrollW: document.documentElement.scrollWidth, vw, wide, small };
`;

const CONFIGS = [
  { name: 'en-dark', dark: true, lang: 'en', theme: 'dark', zoom: 1 },
  { name: 'zh-light', dark: false, lang: 'zh', theme: 'light', zoom: 1 },
  { name: 'en-dark-200pct', dark: true, lang: 'en', theme: 'dark', zoom: 2 },
  { name: 'zh-light-320px', dark: false, lang: 'zh', theme: 'light', zoom: 1, width: 320 },
];

let problems = 0;
for (const c of CONFIGS) {
  await withPage({ width: c.width || 360, height: 640, scale: 2, dark: c.dark }, async (page) => {
    await page.goto(BASE);
    await page.run(`localStorage.setItem('le-prefs', JSON.stringify({ uiLang: '${c.lang}', theme: '${c.theme}' })); localStorage.setItem('le-onboard', JSON.stringify({ intro: true, tips: true, whatsNew: true }));`);
    await page.goto(BASE);
    if (c.zoom !== 1) await page.run(`document.documentElement.style.fontSize = '${c.zoom * 100}%';`);
    for (const [name, setup] of Object.entries(SCENES)) {
      await page.run(setup);
      const m = await page.run(MEASURE);
      await page.shot(join(out, `${c.name}-${name}.png`));
      const bad = m.scrollW > m.vw || m.wide.length || m.small.length;
      if (bad) problems++;
      console.log(`${bad ? 'CHECK' : 'ok   '} ${c.name.padEnd(15)} ${name.padEnd(9)} scrollWidth ${m.scrollW}/${m.vw}` +
        (m.wide.length ? `  wide: ${m.wide.join(', ')}` : '') + (m.small.length ? `  small: ${m.small.join(' | ')}` : ''));
    }
  });
}
console.log(problems ? `\n${problems} screen(s) to look at` : '\nall screens fit, all targets ≥ 44px');
