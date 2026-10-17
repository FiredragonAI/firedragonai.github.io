// Scenes shared by the layout, accessibility and store-screenshot scripts. Each
// one, run in the page in order, leaves the app showing one screen; LE_TEST is
// the page's test hook (present with ?selftest).
export const SAMPLE = 'Tea began as a medicine in southwest China more than two thousand years ago. Monks carried it along the trade routes. By the Tang dynasty it had become an everyday drink.\n\n茶最早是一种药。唐代以后，喝茶成了日常生活的一部分。\n\nMerchants pressed the leaves into bricks so they would survive long journeys. In the seventeenth century, ships brought tea to Europe.';

// Each scene leaves the page showing one screen. `LE_TEST` is the page's test hook.
export const SCENES = {
  intro: `LE_TEST.showIntro(); await new Promise(r => setTimeout(r, 300));`,
  home: `LE_TEST.closeLayer('intro'); await new Promise(r => setTimeout(r, 300));
         const d = { id: 'doc1', title: 'The history of tea', kind: 'web', source: 'example.com', created: Date.now(), opened: Date.now(), position: 3, count: 7, done: false, snippet: '', secs: 60, text: ${JSON.stringify(SAMPLE)} };
         await LE_TEST.DB.saveAll(d); LE_TEST.goTab('library'); LE_TEST.goTab('home'); await new Promise(r => setTimeout(r, 300));`,
  reader: `const d = (await LE_TEST.DB.list())[0]; await LE_TEST.openDoc(d, false); await new Promise(r => setTimeout(r, 300));`,
  selected: `document.querySelector('.sentence[data-i="2"]').click(); await new Promise(r => setTimeout(r, 200));`,
  speed: `history.back(); await new Promise(r => setTimeout(r, 200)); LE_TEST.closeLayer('reader'); await LE_TEST.openDoc((await LE_TEST.DB.list())[0], false); document.getElementById('btnSpeed').click(); await new Promise(r => setTimeout(r, 300));`,
  voice: `history.back(); await new Promise(r => setTimeout(r, 300)); document.getElementById('btnVoice').click(); await new Promise(r => setTimeout(r, 300));`,
  library: `history.back(); await new Promise(r => setTimeout(r, 300)); LE_TEST.closeReader(); await new Promise(r => setTimeout(r, 300)); LE_TEST.goTab('library'); await new Promise(r => setTimeout(r, 300));`,
  settings: `LE_TEST.goTab('settings'); await new Promise(r => setTimeout(r, 300));`,
  feedback: `document.getElementById('btnFeedback').click(); await new Promise(r => setTimeout(r, 300));`,
};

export const BASE = process.env.LE_BASE || 'http://localhost:8771/?selftest';
