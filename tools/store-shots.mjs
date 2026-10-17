// Google Play phone screenshots, taken from the real app at 1080×1920 and then
// given an English headline above each one.
//
//   (serve this folder on :8771 first)  node tools/store-shots.mjs store/screenshots-1.1
//
// Every screen is the live page in a fixed state. What is staged, and why: the
// speech engine is silenced (so a "playing" screen holds still); the voice list
// is empty, so no Windows voice names appear in an Android listing; and the
// fonts are Roboto and Noto, which is what an Android phone draws with. The
// library entries are sample texts written for these pictures.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { withPage } from './cdp.mjs';

const out = resolve(process.argv[2] || 'store/screenshots-1.1');
const raw = join(out, 'raw');
mkdirSync(raw, { recursive: true });
const BASE = process.env.LE_BASE || 'http://localhost:8771/?selftest';
const DAY = 86400000;

const TEA = 'Tea began as a medicine in southwest China more than two thousand years ago. Monks carried it along the trade routes, and by the Tang dynasty it had become an everyday drink. Merchants pressed the leaves into bricks so they would survive long journeys on horseback. In the seventeenth century, ships brought tea to Europe, where it was first sold by apothecaries. Within a hundred years it had become the national drink of Britain. Today it is the most widely consumed drink in the world after water.';
const PHRASES = 'Phrases for ordering coffee, in seven languages.\n\n我想要一杯热咖啡，不加糖。\n\nQuisiera un café con leche, por favor.\n\nホットコーヒーを一つください。\n\nLe café est délicieux, merci beaucoup.\n\nEin Kaffee für mich, das ist alles.\n\n아메리카노 한 잔 주세요.';
const NOTES = 'Chapter three covers how cells turn food into energy. Mitochondria break down glucose and store the energy in molecules of ATP. The process needs oxygen, which is why it is called aerobic respiration.';
const RECIPE = 'Lemon pancakes. Mix two cups of flour with a spoon of sugar and a pinch of salt. Whisk in two eggs, a cup of milk and the juice of one lemon. Cook on a hot pan until golden.';
const LEASE = 'This agreement is made between the landlord and the tenant for the apartment described below. The term of the lease is twelve months, starting on the first day of the month.';

const docs = [
  { id: 'tea', title: 'The history of tea', kind: 'web', source: 'example.com', text: TEA, position: 3, count: 7, done: false, ago: 0 },
  { id: 'phrases', title: 'Coffee phrases', kind: 'text', source: 'Typed text', text: PHRASES, position: 0, count: 7, done: false, ago: 0.1 },
  { id: 'notes', title: 'Biology notes, chapter 3', kind: 'word', source: 'Biology notes.docx', text: NOTES, position: 1, count: 3, done: false, ago: 1 },
  { id: 'recipe', title: 'Lemon pancakes', kind: 'photo', source: 'Photo', text: RECIPE, position: 0, count: 4, done: true, ago: 2 },
  { id: 'lease', title: 'Apartment lease', kind: 'pdf', source: 'Lease.pdf', text: LEASE, position: 0, count: 2, done: false, ago: 4 },
];

// Runs before the app's own script on every load.
const ANDROID_LOOK = `
  speechSynthesis.speak = () => {};
  Object.defineProperty(speechSynthesis, 'getVoices', { value: () => [] });
  document.addEventListener('DOMContentLoaded', () => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+SC&family=Noto+Serif+JP&family=Noto+Serif+KR&display=block';
    document.head.appendChild(l);
    const st = document.createElement('style');
    st.textContent = 'html:root { --ui: Roboto, "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif; --reading: "Source Serif 4", "Noto Serif SC", "Noto Serif JP", "Noto Serif KR", serif; }';
    document.head.appendChild(st);
  });
`;
const SETUP = `
  await LE_TEST.DB.clear();
  const now = Date.now();
  for (const d of ${JSON.stringify(docs)}) {
    const secs = LE_TEST.estimateSeconds(d.text);
    await LE_TEST.DB.saveAll(Object.assign({}, d, { created: now - d.ago * ${DAY}, opened: now - d.ago * ${DAY}, snippet: '', secs }));
  }
`;
const wait = (ms) => `await new Promise(r => setTimeout(r, ${ms}));`;
const open = (id, at, play) => `const d = (await LE_TEST.DB.list()).find(x => x.id === '${id}'); await LE_TEST.openDoc(d, false); ${wait(200)}
  ${at != null ? `document.getElementById('seek').value = ${at + 1}; document.getElementById('seek').dispatchEvent(new Event('change')); ${wait(150)}` : ''}
  ${play ? `LE_TEST.togglePlay(); ${wait(250)} document.querySelector('.sentence.speaking').scrollIntoView({ block: 'center' }); ${wait(300)}` : ''}`;

// [file, headline, supporting line, page setup, { listenIn: true } to list the Listen-in languages]
const SHOTS = [
  ['01-listen-to-anything', 'Listen to anything', 'Text, PDF and Word files, photos of pages, web pages',
    `LE_TEST.goTab('library'); LE_TEST.goTab('home'); ${wait(300)} document.getElementById('views').scrollTop = 0;`],
  ['02-follow-along', 'Follow every sentence', 'The one being read lights up. Tap any sentence to jump there.',
    open('tea', 2, true)],
  ['03-many-languages', 'Every sentence in its own language', 'Mixed texts switch voices by themselves',
    `LE_TEST.closeReader(); ${wait(300)} ${open('phrases', 1, true)}`],
  ['04-your-speed', 'Your speed, right away', 'From 0.5× to 2×, changed while it reads',
    `LE_TEST.closeReader(); ${wait(300)} ${open('tea', 3, true)} LE_TEST.setRate(1.25, true); document.getElementById('btnSpeed').click(); ${wait(400)}`],
  ['05-library', 'Pick up where you left off', 'Your library keeps every text and your place in it',
    `history.back(); ${wait(300)} LE_TEST.pause(); LE_TEST.closeReader(); ${wait(300)} LE_TEST.goTab('library'); ${wait(400)}`],
  ['06-listen-in', 'Hear it in another language', 'Translated as you listen, into any of these:',
    `LE_TEST.goTab('home'); ${wait(200)} ${open('tea', 1, false)} document.getElementById('listenIn2').value = 'es'; document.getElementById('btnVoice').click(); ${wait(300)} document.getElementById('listenIn2').value = 'es'; document.getElementById('listenIn2').dispatchEvent(new Event('change')); ${wait(300)}`, { listenIn: true }],
  ['07-private', 'Private by design', 'No account. No ads. No tracking. Your texts stay on your phone.',
    `history.back(); ${wait(300)} LE_TEST.closeReader(); ${wait(300)} LE_TEST.showIntro(); ${wait(400)}`],
];

let listenIn = [];
await withPage({ width: 360, height: 640, scale: 3, dark: true }, async (page) => {
  await page.init(ANDROID_LOOK);
  await page.goto(BASE);
  await page.run(`localStorage.setItem('le-prefs', JSON.stringify({ uiLang: 'en', theme: 'dark' })); localStorage.setItem('le-onboard', JSON.stringify({ intro: true, tips: true, whatsNew: true }));`);
  await page.goto(BASE);
  await page.run(SETUP);
  await page.goto(BASE);                        // fresh boot with the library in place
  // The languages "Listen in" offers, read from the app itself so the picture can't drift from it.
  listenIn = await page.run("return [...document.getElementById('listenIn').options].slice(1).map((o) => [o.value, o.textContent])");
  for (const [file, , , setup] of SHOTS) {
    await page.run(setup);
    await page.run('await document.fonts.ready; await new Promise(r => setTimeout(r, 300));');
    await page.shot(join(raw, `${file}.png`));
    console.log('raw', file);
  }
  await page.run(`LE_TEST.closeLayer('intro'); localStorage.setItem('le-prefs', '{}');`);
});

// Compose: dark backdrop, headline and supporting line on top, the screen below.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
await withPage({ width: 1080, height: 1920, scale: 1, mobile: false, dark: true }, async (page) => {
  for (const [file, head, sub, , opts] of SHOTS) {
    const img = readFileSync(join(raw, `${file}.png`)).toString('base64');
    const html = `<!doctype html><html><head><meta charset="utf-8">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Noto+Sans+SC&family=Noto+Sans+TC&family=Noto+Sans+JP&family=Noto+Sans+KR&family=Noto+Sans+Arabic&family=Noto+Sans+Devanagari&family=Noto+Sans+Bengali&display=block"><style>
      html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#16181D}
      body{font-family:Roboto,"Noto Sans SC","Noto Sans TC","Noto Sans JP","Noto Sans KR","Noto Sans Arabic","Noto Sans Devanagari","Noto Sans Bengali",system-ui,sans-serif;color:#F2F4F7;display:flex;flex-direction:column;align-items:center}
      .top{min-height:400px;width:100%;box-sizing:border-box;padding:88px 80px 28px;text-align:center;background:radial-gradient(1200px 520px at 50% -120px,#2B4F8C 0%,#16181D 70%)}
      .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:24px}
      .chips span{font-size:30px;line-height:1.3;padding:8px 20px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.24)}
      .stage{flex:1;min-height:0;width:100%;box-sizing:border-box;padding-bottom:16px;display:flex;justify-content:center}
      h1{font-size:76px;line-height:1.08;margin:0 0 26px;font-weight:700;letter-spacing:-.5px}
      p{font-size:38px;line-height:1.3;margin:0;color:#C9D2DE}
      .phone{height:100%;aspect-ratio:1080/1920;border-radius:56px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 10px #2A2E36}
      .phone img{width:100%;height:100%;display:block}
    </style></head><body><div class="top"><h1>${esc(head)}</h1><p>${esc(sub)}</p>${opts && opts.listenIn ? `<div class="chips">${listenIn.map(([code, name]) => `<span lang="${code}">${esc(name)}</span>`).join('')}</div>` : ''}</div><div class="stage"><div class="phone"><img src="data:image/png;base64,${img}"></div></div></body></html>`;
    const tmp = join(raw, `${file}.html`);
    writeFileSync(tmp, html);
    await page.goto('file:///' + tmp.replace(/\\/g, '/'));
    await page.run('await document.fonts.ready;');
    await page.shot(join(out, `${file}.png`));
    console.log('composed', file);
  }
});
