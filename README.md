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

## Android (Google Play)

The Play build is a Trusted Web Activity over this site, generated from
`android/twa-manifest.json`:

```bash
cd android && npx @bubblewrap/cli update && ./gradlew bundleRelease
```

Two things that bite:

- `minSdkVersion` must be **24 or higher**. Play's automatic protection refuses a
  bundle built with 23, and the upload is rejected with no bundle accepted.
- `bubblewrap update` regenerates `app/build.gradle` and **drops the signing
  config**, which then produces an unsigned bundle that Play rejects later and
  less clearly. After regenerating, re-add the block that reads
  `../android-key.properties` (see git history for the exact snippet).

The keystore lives outside the repository, with its password in
`android-key.properties`. Both are gitignored, and losing either means this app
can never be updated again.
