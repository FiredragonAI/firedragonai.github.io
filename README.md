# Listen Everything — web

Read anything aloud in a phone or computer browser: typed or pasted text, files
(text, Markdown, HTML, Word, PDF), photos of pages, and web pages by address — in any
language, spoken by the device's own voices, sentence by sentence with the current
one highlighted.

Open **index.html** from this site; on a phone, *Add to Home Screen* installs it like
an app. Nothing is sent anywhere except the two features that need a service: **web
page** (fetched through the `r.jina.ai` reader, because browsers do not let a page
read another site) and **listen in** translation (MyMemory, free). Photo recognition
runs in the browser (Tesseract.js) and downloads its language data on first use.

This is the browser edition of the Listen Everything desktop app. The page is a
single file; `build.sh` wraps the app's source page into a full document for hosting.
