# Main Website → Elementor converter

Turns the live Main Website (Next.js) into a bundle that **Acadvizen Master Admin → Import Main Website** loads into WordPress: native Elementor containers and widgets, the media library, the Main Website menu, Site Settings colours and fonts, shared designs (Website Design) and one record per page, each keeping its address.

It only reads: it opens public pages in a headless browser and reads published rows with the public (anon) Supabase key. It writes nothing to the Main Website or Supabase.

```sh
# NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (the public values).
node tools/main-to-elementor/build-bundle.mjs --only shell,tools --out bundle-tools.json
node tools/main-to-elementor/build-bundle.mjs --only blogs --out bundle-blogs.json
node tools/main-to-elementor/build-bundle.mjs --only services,pages --out bundle-pages.json
# options: --main https://www.acadvizen.com (default), --limit N (first N records of each family)
```

Import `shell,tools` first: it brings the header, footer, menu and Main Website CSS the other bundles use.

| File | Does |
|---|---|
| `capture.mjs` | opens a route at desktop 1440, tablet 800 and mobile 390 px and splits it into header, main and footer |
| `extract.mjs` | reads the DOM with computed styles (runs in the page) |
| `convert.mjs` | builds Elementor JSON: Flexbox/Grid containers, Heading, Text Editor, Button, Image, Video (poster + play icon), Accordion, Image Carousel (logo strips), HTML; responsive settings; global colours/fonts keyed by value; Main lead forms → `[acv_lead_form]` |
| `families.mjs` | per family: blog design/card/listing, service pages (one shared design), individual pages, courses |
| `elementor-json.mjs` | helpers to find and replace elements in Elementor JSON |
| `build-bundle.mjs` | CLI; shell, menu, tools, media and the bundle file |

What is not converted automatically, and is listed in the bundle's `notes`: forms other than the Main lead forms, animations and hover effects (re-create them with Elementor's Motion Effects), and content that appears only after a click.

How a few Main Website patterns are converted:

- **Course-module accordions:** a panel laid out as a grid of cards becomes a plain list in the answer's Text Editor, drawn as the same cards (with coloured dots, one column on phones). Editing a point means editing a list item.
- **Logos in a sized frame** (`next/image` fill): the frame is kept, so the logo keeps its size and its caption stays below it.
- **Service/location pages:** only Page Builder rows (Supabase `pages`) drawn by the shared layout become Locations. Application pages such as `/companies` or `/resources` keep their own design, even when their list loads after the page.
- **Titles:** the Main Website shows most titles with "| Acadvizen" twice; WordPress stores it once (fixed on the Main Website in `app/lib/seo.js`).
- **Network:** a dropped connection during a build is retried (three times, with a pause); HTTP answers are used as they come.
- **Text cut to a few lines** (card excerpts and titles with an ellipsis) keeps that limit. Text with a scripted "Read more" after it gets the plugin's Read more instead: the Text Editor carries the CSS class `acv-readmore` (and `--acv-lines` when it is not 6 lines), and the plugin adds the "Read more" / "Read less" toggle.
- **Accordion subtitles** ("70 Days | Focus: …" under a course module's title) stay in the title row as a second line, visible while the item is closed.
- **Fixed full-window layers** (the page's glow backdrop) are 100vh tall, behind the content.
- **Mobile header:** the menu widget's own toggle (right, small bordered box) replaces the Main Website's hamburger button.
- **Related tools:** six tools of the same category, newest first in the Main Website's own order, minus the one being viewed (`exclude_current="after"`).
- **Main Website CSS** parts that belong to one family are marked `/* acv:NAME */ … /* acv:end */`; importing another bundle later keeps them, so bundles can be imported in any order.
- **Test data:** the Main Website's end-to-end test records (`local-e2e-…`) are left out, along with their menu links and their cards and tiles in designs (course grids, tool strips).
- **Badges and pills** (a text with its own background or border) keep their font: global colours and global fonts are merged into one `__globals__` (`mergeSettings`).
- **Logo strips:** logos per row = the visible width ÷ the strip's average item (padding and gap included), measured on each device.
- **Contact and lead forms:** a field's label above it, Main's field order, side-by-side rows (`fields="name,phone+email,…"`) and the "Fresher / Experienced" choice carry over to `[acv_lead_form]`.
- **Embedded maps** keep their measured height (a frame without it is 150 px).

Scripted controls are replaced by Elementor's own behaviour or left out: a "Play Video" overlay becomes the Video widget's play icon, and a "Read more" that unclamps a few lines of text becomes the plugin's Read more (above).
