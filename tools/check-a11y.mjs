// Automated accessibility audit (axe-core, WCAG 2.1 A/AA + best practices) of
// every screen, in English/dark and Chinese/light.
//
//   (serve this folder on :8771 first)  node tools/check-a11y.mjs
//
// axe finds roughly a third of real problems -- the mechanical ones: names,
// roles, contrast, structure. The TalkBack checklist in the final report covers
// what only a person with a screen reader can judge.
import { withPage } from './cdp.mjs';
import { BASE, SCENES } from './scenes.mjs';

const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
const RUN = `
  if (!window.axe) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = '${AXE}'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
  return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, where: v.nodes.slice(0, 3).map(n => n.target.join(' ') + (n.any[0] ? ' — ' + n.any[0].message : '')) }));
`;

let total = 0;
for (const c of [{ name: 'en-dark', lang: 'en', theme: 'dark', dark: true }, { name: 'zh-light', lang: 'zh', theme: 'light', dark: false }]) {
  await withPage({ width: 360, height: 640, scale: 1, dark: c.dark }, async (page) => {
    await page.goto(BASE);
    await page.run(`localStorage.setItem('le-prefs', JSON.stringify({ uiLang: '${c.lang}', theme: '${c.theme}' })); localStorage.setItem('le-onboard', JSON.stringify({ intro: true, tips: true, whatsNew: true }));`);
    await page.goto(BASE);
    for (const [name, setup] of Object.entries(SCENES)) {
      await page.run(setup);
      const v = await page.run(RUN);
      total += v.length;
      console.log(`${v.length ? 'CHECK' : 'ok   '} ${c.name.padEnd(9)} ${name}`);
      for (const x of v) console.log(`        [${x.impact}] ${x.id}: ${x.help} (${x.nodes})\n          ${x.where.join('\n          ')}`);
    }
  });
}
console.log(total ? `\n${total} violation group(s)` : '\nno violations');
