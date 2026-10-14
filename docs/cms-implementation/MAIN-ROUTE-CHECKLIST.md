# Main route checklist

Generated 2026-10-14 05:00 UTC from evidence files only. Every value below was read; nothing is assumed.

## Summary

| Check | Result | Evidence |
|---|---|---|
| Production addresses (sitemap) | **314**: 277 planned for WordPress/Elementor, 37 kept on Next.js | `evidence/route-audit/prod-visible-*.json` (GET only, one at a time, 2026-10-13 19:57 UTC) |
| Live check on production (status 200, canonical, not noindex, visible text; 13 Oct 19:57 UTC, re-reads 14 Oct) | **314/314 pass**. 6 addresses were read a second time after a connection error or browser timeout | same |
| Internal links (Main) | 314 pages, 138 distinct internal link targets: **0 broken**, 0 redirects | `evidence/route-audit/prod-links-*.json` (2026-10-13 20:12 UTC) |
| Doubled "\| Acadvizen" titles | 0 of 314 | same |
| Existing SEO observations (not caused by this work; unchanged since 13 Oct) | 189 addresses without an H1 in the HTML; 1 title(s) and 3 description(s) used by more than one address | same |
| Production migration | **Not started for any address** (needs OWNER-ACTIONS P1–P10) | — |
| LOCAL rehearsal (local copy: 103 addresses) | 86 identical to Main's own page on every check; 17 with differences, classified below | `evidence/sitewide-migration/` |


## LOCAL rehearsal #7: every difference, classified

Rehearsal #7 (14 Oct, local copy, 103 addresses): every page Main draws itself was converted, imported under approval, approved with each website's preview confirmed, published (92 items), verified (92 of 92) and compared with **Main's own page** at the same address (`?acv-main=1`, Render Bridge skipped). Evidence: `evidence/sitewide-migration/rehearsal7/`.

| Addresses | Difference | Class | Evidence / reason |
|---|---|---|---|
| `/elementor-bridge-proof`, `/jayanagar`, `/neet-coaching`, `/perf-full`, `/perf-new`, `/perf-nocss`, `/perf-nocssglob`, `/perf-noglob`, `/perf-noresp` (9) | Main has no page of its own (404 there) | **Expected**: not migration targets | WordPress-only pages created by earlier local tests; the converter skips them with a note ("Main has no page of its own") |
| `/`, `/social-media-marketing-course-in-bangalore`, `/google-ads-course-in-bangalore`, `/ai-digital-marketing-course`, `/digital-marketing-internship-in-bangalore` (5) | "Play Video" label missing | **Expected (accepted, O-36)** | Main's scripted label over the video becomes Elementor's play button; the same video file plays |
| `/blog/master-admin-blog-check` (1) | Robots had Rank Math's `max-snippet…` defaults | **Genuine defect, fixed after this run** | Main title and robots defaults for WordPress content shown on Main (`design.php`). Verified on 14 Oct on a page WordPress draws for Main (`/elementor-bridge-proof`): before "… - Acadvizen Enroll (LOCAL)" with `max-snippet…`, now "… \| Acadvizen" with "index, follow" |
| `/tools/adroll` (1) | Not read after publishing (status 0) | **Environmental** | The PC entered Modern Standby 03:36–04:39 UTC during the run; this one read failed right after waking. In rehearsal #6 the same address was identical on every check |
| `/tools/local-e2e-tool-1779297401` (1) | Test record | **Expected**: local test data | A tool left by earlier local end-to-end tests; never on production |

Course landing page descriptions (a difference in rehearsal #6) are identical in rehearsal #7: the converter now copies the description Main's server sends.

Recovery: after each rehearsal the local database was restored from its checksummed backup. Rehearsal #6 restore, measured by rehearsal #7's baseline: **102 of 103 identical**; the one difference is an animated visitor counter on `/elementor-bridge-proof` (a different number on every load).

## By route family

| Family | Addresses | Owner after migration | Live check pass |
|---|---|---|---|
| Page Builder page | 109 | WordPress / Elementor | 109/109 |
| blog post | 86 | WordPress / Elementor | 86/86 |
| tool page | 67 | WordPress / Elementor | 67/67 |
| programmatic city page | 28 | Next.js (stays Main) | 28/28 |
| dedicated page | 14 | WordPress / Elementor | 14/14 |
| data list/detail | 4 | Next.js (stays Main) | 4/4 |
| course | 2 | Next.js (stays Main) | 2/2 |
| homepage | 1 | WordPress / Elementor | 1/1 |
| blog list | 1 | Next.js (stays Main) | 1/1 |
| tool list | 1 | Next.js (stays Main) | 1/1 |
| blog taxonomy | 1 | Next.js (stays Main) | 1/1 |

## Every production address

Columns: live facts on production (status / canonical / robots / JSON-LD blocks / forms / visible text lines); how many Main pages link to the address in the HTML their server sends (lists that add their links in the browser, such as `/tools`, are not counted, so 0 does not mean unreachable); LOCAL rehearsal result for the same address on the local copy (where it exists); production migration.

| Path | Owner | Live: status / canonical / robots / JSON-LD / forms / text lines | Live check | Linked from | Notes | LOCAL rehearsal | Production migration |
|---|---|---|---|---|---|---|---|
| `/` | WordPress / Elementor | 200 / yes / index, follow / 11 / 0 / 270 | pass | 314 (answers 200) | — | text (missing e.g. "Play Video") (text 99.7%) | not started |
| `/about` | WordPress / Elementor | 200 / yes / index, follow / 11 / 0 / 85 | pass | 314 (answers 200) | — | identical (text 100%) | not started |
| `/achievements` | WordPress / Elementor | 200 / yes / index, follow / 10 / 0 / 62 | pass | 314 (answers 200) | — | identical (text 100%) | not started |
| `/contact` | WordPress / Elementor | 200 / yes / index, follow / 10 / 1 / 58 | pass | 314 (answers 200) | — | identical (text 100%) | not started |
| `/blog` | Next.js (stays Main) | 200 / yes / index, follow / 10 / 0 / 287 | pass | 314 (answers 200) | — | identical (text 100%) | stays on Next.js |
| `/courses` | Next.js (stays Main) | 200 / yes / index, follow / 10 / 0 / 234 | pass | 314 (answers 200) | — | identical (text 100%) | stays on Next.js |
| `/tools` | Next.js (stays Main) | 200 / yes / index, follow / 10 / 0 / 59 | pass | 68 (answers 200) | no H1 in the HTML | identical (text 100%) | stays on Next.js |
| `/placement` | Next.js (stays Main) | 200 / yes / index, follow / 11 / 0 / 169 | pass | 314 (answers 200) | — | identical (text 100%) | stays on Next.js |
| `/testimonials` | WordPress / Elementor | 200 / yes / index, follow / 10 / 0 / 70 | pass | 1 (answers 200) | — | identical (text 100%) | not started |
| `/projects` | WordPress / Elementor | 200 / yes / index, follow / 10 / 0 / 210 | pass | 2 (answers 200) | — | identical (text 100%) | not started |
| `/soft-skills` | WordPress / Elementor | 200 / yes / index, follow / 10 / 0 / 49 | pass | 1 (answers 200) | — | identical (text 100%) | not started |
| `/hire-from-us` | WordPress / Elementor | 200 / yes / index, follow / 10 / 0 / 68 | pass | 0 | — | identical (text 100%) | not started |
| `/privacy-policy` | WordPress / Elementor | 200 / yes / index, follow / 10 / 0 / 82 | pass | 314 (answers 200) | — | identical (text 100%) | not started |
| `/terms-of-service` | WordPress / Elementor | 200 / yes / index, follow / 10 / 0 / 64 | pass | 314 (answers 200) | — | identical (text 100%) | not started |
| `/seo-course-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 1 / 134 | pass | 0 | description shared with another address | identical (text 100%) | not started |
| `/social-media-marketing-course-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 1 / 134 | pass | 0 | title shared with another address; description shared with another address | text (missing e.g. "Play Video") (text 99.7%) | not started |
| `/google-ads-course-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 1 / 134 | pass | 0 | description shared with another address | text (missing e.g. "Play Video") (text 99.7%) | not started |
| `/ai-digital-marketing-course` | WordPress / Elementor | 200 / yes / index, follow / 12 / 1 / 134 | pass | 0 | description shared with another address | text (missing e.g. "Play Video") (text 99.7%) | not started |
| `/digital-marketing-internship-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 1 / 134 | pass | 0 | description shared with another address | text (missing e.g. "Play Video") (text 99.7%) | not started |
| `/companies` | Next.js (stays Main) | 200 / yes / index, follow / 10 / 0 / 45 | pass | 0 | — | identical (text 100%) | stays on Next.js |
| `/internships` | Next.js (stays Main) | 200 / yes / index, follow / 10 / 0 / 45 | pass | 0 | — | identical (text 100%) | stays on Next.js |
| `/resources` | Next.js (stays Main) | 200 / yes / index, follow / 10 / 0 / 46 | pass | 0 | — | identical (text 100%) | stays on Next.js |
| `/ai-digital-marketing-course-in-chamarajpet` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/course-basic` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 51 | pass | 0 | — | — | not started |
| `/social-media-marketing-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/seo-course-in-jayanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-jayanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-jayanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-btm-layout` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-digital-marketing-course-in-jayanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/content-marketing-course-in-jayanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-analytics-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-digital-marketing-course-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-btm-layout` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-btm-layout` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-btm-layout` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-btm-layout` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/content-marketing-course-in-btm-layout` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-analytics-course-in-btm-layout` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-btm-layout` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/diploma-in-digital-marketing-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/degree-in-digital-marketing-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-integrated-digital-marketing-course-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/top-10-digital-marketing-institutes-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-jp-nagar` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/content-marketing-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-analytics-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-whitefield` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-whitefield` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/dropshipping-course-in-bangalore` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-integrated-digital-marketing-course-in-jp-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-mg-road` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/content-marketing-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-integrated-digital-marketing-course-in-mg-road` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-rajajinagar` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/search-engine-optimization-seo` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/search-engine-marketing-sem-google-ads` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-smm` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML; title shared with another address | — | not started |
| `/paid-social-media-advertising-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/content-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/influencer-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/video-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/conversion-rate-optimization-cro-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/web-analytics-data-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-powered-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-partnership-marketing-course-in-rajajinagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-bidadi` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/paid-social-media-advertising-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/content-marketing-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/influencer-marketing-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/video-marketing-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/conversion-rate-optimization-cro-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/web-analytics-data-marketing-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-powered-marketing-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-partnership-marketing-course-in-bidadi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-ramanagar` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-ramanagar-acadvizen` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-ramanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-ramanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/dropshipping-course-in-ramanagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/dropshipping-course-in-koramangala` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-koramangala` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/ai-digital-marketing-course-in-koramangala` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-koramangala` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-koramangala` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/seo-course-in-koramangala` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-koramangala` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-koramangala` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-electronic-city` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/ai-digital-marketing-course-in-electronic-city` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-electronic-city` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-electronic-city` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-electronic-city` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/dropshipping-course-in-electronic-city` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-rr-nagar` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/ai-digital-marketing-course-in-rr-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/seo-course-in-banashankari` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/social-media-marketing-course-in-rr-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/smm-course-in-national-college` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-ads-course-in-rr-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/seo-course-in-rr-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-rr-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-rr-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/dropshipping-course-in-rr-nagar` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-whitefield` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/ai-digital-marketing-course-in-whitefield` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/seo-course-in-whitefield` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-whitefield` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-whitefield` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/smm-course-in-banashankari` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-banashankari` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-banashankari` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-digital-marketing-course-in-banashankari` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-digital-marketing-course-in-banashankari` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-banashankari` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-national-college` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-national-college` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-national-college` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-digital-marketing-course-in-national-college` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-digital-marketing-course-in-national-college` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/digital-marketing-course-in-basavanagudi` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-basavanagudi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/email-marketing-course-in-basavanagudi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/smm-course-in-basavanagudi-social-media-marketing` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/google-digital-marketing-course-in-basavanagudi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/ai-digital-marketing-course-in-basavanagudi` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML; read again (first pass: connection error or browser timeout) | — | not started |
| `/digital-marketing-course-in-chamarajpet` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | stays on Next.js |
| `/seo-course-in-chamarajpet` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/smm-course-in-chamarajpet-social-media-marketing` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/affiliate-marketing-course-in-chamarajpet` | WordPress / Elementor | 200 / yes / index, follow / 12 / 0 / 43 | pass | 0 | no H1 in the HTML | — | not started |
| `/blog/google-ads-ai-max-explained-what-the-september-2026-auto-upgrade-changed` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 125 | pass | 2 (answers 200) | — | identical (text 100%) | not started |
| `/blog/digital-marketing-course-in-bangalore-fees-placements` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 192 | pass | 18 (answers 200) | — | — | not started |
| `/blog/how-to-use-claude-ai-for-digital-marketing-practical-guide` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 171 | pass | 18 (answers 200) | — | — | not started |
| `/blog/digital-marketing-course-in-bangalore-your-big-opportunity` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 138 | pass | 18 (answers 200) | — | — | not started |
| `/blog/24-digital-marketing-tools-you-actually-need-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 186 | pass | 17 (answers 200) | — | — | not started |
| `/blog/how-to-get-leads-on-meta-business-suite-using-claude` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 139 | pass | 2 (answers 200) | — | — | not started |
| `/blog/how-to-create-a-landing-page-website-in-wordpress` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 139 | pass | 1 (answers 200) | — | — | not started |
| `/blog/ready-for-your-digital-marketing-plans-to-generate-results` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 207 | pass | 1 (answers 200) | — | — | not started |
| `/blog/same-marketing-different-results-why-seo-isn-t-working` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 126 | pass | 1 (answers 200) | — | — | not started |
| `/blog/running-ads-without-digital-strategy-you-re-burning-money` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 122 | pass | 1 (answers 200) | — | — | not started |
| `/blog/doctor-of-digital-marketing-skills-beat-tools-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 117 | pass | 1 (answers 200) | — | — | not started |
| `/blog/meta-ads-ai-stack-andromeda-claude-performance-ads` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 108 | pass | 1 (answers 200) | — | — | not started |
| `/blog/ai-powered-lead-generation-smarter-leads-higher-roi-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 112 | pass | 1 (answers 200) | — | — | not started |
| `/blog/meta-andromeda-ai-smarter-facebook-instagram-ads-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 115 | pass | 1 (answers 200) | — | — | not started |
| `/blog/10-powerful-use-cases-every-marketer-should-know-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 133 | pass | 1 (answers 200) | — | — | not started |
| `/blog/claude-ai-meta-integration-guide-for-marketers-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 123 | pass | 1 (answers 200) | — | — | not started |
| `/blog/claude-ai-for-digital-marketers-2026-guide-acadvizen` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 140 | pass | 1 (answers 200) | — | — | not started |
| `/blog/keyword-research-vs-prompt-research-the-future-of-seo` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 125 | pass | 1 (answers 200) | — | — | not started |
| `/blog/google-ads-bidding-update-2026-what-marketers-must-know` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 134 | pass | 1 (answers 200) | — | — | not started |
| `/blog/digital-marketing-trends-2026-complete-guide-for-marketers` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 116 | pass | 1 (answers 200) | — | — | not started |
| `/blog/top-seo-mistakes-costing-you-traffic-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 374 | pass | 1 (answers 200) | — | — | not started |
| `/blog/zero-click-seo-google-ai-overviews-snippets` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 159 | pass | 1 (answers 200) | — | — | not started |
| `/blog/dummy-dm-course` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 49 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-to-choose-the-right-affiliate-marketing-program-as-a-beginner` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 136 | pass | 1 (answers 200) | — | — | not started |
| `/blog/complete-roadmap-to-become-a-digital-marketer-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 135 | pass | 1 (answers 200) | — | — | not started |
| `/blog/local-seo-guide-how-small-businesses-can-rank-on-google-maps` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 148 | pass | 1 (answers 200) | — | — | not started |
| `/blog/why-brands-are-shifting-budgets-from-tv-ads-to-digital-campaigns` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 99 | pass | 1 (answers 200) | — | — | not started |
| `/blog/the-role-of-marketing-automation-tools-in-modern-businesses` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 101 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-to-negotiate-your-first-digital-marketing-salary` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 118 | pass | 1 (answers 200) | — | — | not started |
| `/blog/e-commerce-marketing-trends-to-watch-this-festive-season-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 145 | pass | 1 (answers 200) | — | — | not started |
| `/blog/paid-ads-vs-affiliate-marketing-which-has-better-roi-for-beginners` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 188 | pass | 1 (answers 200) | — | — | not started |
| `/blog/best-affiliate-marketing-niches-2026-high-commission-low-competition-opportunities-for-beginners` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 185 | pass | 1 (answers 200) | — | — | not started |
| `/blog/digital-marketing-for-non-it-graduates-is-it-a-good-career-switch` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 134 | pass | 1 (answers 200) | — | — | not started |
| `/blog/remote-digital-marketing-jobs-how-to-get-hired-by-global-companies-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 164 | pass | 1 (answers 200) | — | — | not started |
| `/blog/programmatic-seo-how-brands-rank-for-thousands-of-keywords-at-once` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 180 | pass | 1 (answers 200) | — | — | not started |
| `/blog/internship-to-full-time-job-how-acadvizen-students-convert-opportunities` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 153 | pass | 1 (answers 200) | — | — | not started |
| `/blog/voice-search-optimization-is-your-brand-ready-for-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 206 | pass | 1 (answers 200) | — | — | not started |
| `/blog/short-form-video-marketing-why-15-seconds-can-make-or-break-your-brand` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 203 | pass | 1 (answers 200) | — | — | not started |
| `/blog/chatgpt-gemini-claude-which-ai-tool-will-marketers-utilize-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 129 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-ai-search-sge-is-changing-the-way-people-find-information-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 330 | pass | 1 (answers 200) | — | — | not started |
| `/blog/email-marketing-automation-in-2026-sequences-that-actually-sell` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 146 | pass | 1 (answers 200) | — | — | not started |
| `/blog/lead-generation-ads-that-convert-7-templates-that-work-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 139 | pass | 1 (answers 200) | — | — | not started |
| `/blog/why-you-should-still-invest-in-a-website-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 118 | pass | 1 (answers 200) | — | — | not started |
| `/blog/why-should-every-marketer-care-about-aeo-and-geo-in-2026-rather-than-just-seo` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 132 | pass | 1 (answers 200) | — | — | not started |
| `/blog/best-digital-marketing-tools-every-beginner-should-know-in-2026-free-paid` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 135 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-to-get-your-first-freelance-digital-marketing-client-in-2026-complete-beginner-s-guide` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 132 | pass | 1 (answers 200) | — | — | not started |
| `/blog/email-marketing-in-2026-the-complete-strategy-guide-to-higher-opens-clicks-and-revenue` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 126 | pass | 1 (answers 200) | — | — | not started |
| `/blog/why-instagram-marketing-matters-for-businesses-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 140 | pass | 1 (answers 200) | — | — | not started |
| `/blog/on-page-seo-the-complete-beginner-s-guide-to-higher-google-rankings-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 149 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-will-ai-impact-digital-marketing-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 190 | pass | 1 (answers 200) | — | — | not started |
| `/blog/the-ultimate-seo-strategy-guide-how-to-rank-higher-on-google-and-grow-your-business-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 147 | pass | 1 (answers 200) | — | — | not started |
| `/blog/the-complete-acadvizen-guide-to-launching-a-digital-marketing-career-in-2025` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 233 | pass | 1 (answers 200) | — | — | not started |
| `/blog/why-learn-digital-marketing-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 138 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-artificial-intelligence-is-transforming-digital-marketing-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 282 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-search-engines-work-complete-seo-basics-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 311 | pass | 1 (answers 200) | — | — | not started |
| `/blog/growth-hacking-techniques-for-digital-marketers-in-2026-ai-marketing-trends` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 284 | pass | 1 (answers 200) | — | — | not started |
| `/blog/keyword-research-strategies-for-better-google-rankings` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 258 | pass | 1 (answers 200) | — | — | not started |
| `/blog/ai-and-automation-in-digital-marketing-future-trends-explained` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 238 | pass | 1 (answers 200) | — | — | not started |
| `/blog/seo-vs-performance-marketing-which-career-is-better-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 177 | pass | 1 (answers 200) | — | — | not started |
| `/blog/top-5-mistakes-freshers-make-in-their-first-digital-marketing-job` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 166 | pass | 1 (answers 200) | — | — | not started |
| `/blog/from-campus-to-career-how-acadvizen-inspired-future-digital-marketers-at-the-c2c-expo-2026` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 243 | pass | 1 (answers 200) | — | — | not started |
| `/blog/top-10-digital-marketing-agencies-in-india-hiring-right-now-2026-edition` | WordPress / Elementor | 200 / yes / index, follow / 16 / 0 / 74 | pass | 1 (answers 200) | — | — | not started |
| `/blog/mastering-global-meta-ads-running-campaigns-for-international-brands-2026-guide` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 103 | pass | 1 (answers 200) | — | — | not started |
| `/blog/the-german-job-seeker-visa-a-complete-guide-for-digital-marketers-2026-edition` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 96 | pass | 1 (answers 200) | — | — | not started |
| `/blog/digital-marketing-in-the-uk-vs-india-salary-and-growth-comparison-2026-edition` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 98 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-to-land-a-high-paying-remote-job-for-a-us-based-company-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 104 | pass | 1 (answers 200) | — | — | not started |
| `/blog/placement-faq-everything-you-need-to-know-about-our-100-support` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 101 | pass | 1 (answers 200) | — | — | not started |
| `/blog/why-bangalore-hyderabad-are-the-hubs-for-performance-marketers-in-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 103 | pass | 1 (answers 200) | — | — | not started |
| `/blog/behind-the-scenes-a-day-in-the-life-of-our-performance-marketing-student` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 64 | pass | 1 (answers 200) | — | — | not started |
| `/blog/how-to-crack-the-google-and-accenture-digital-marketing-interview` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 65 | pass | 1 (answers 200) | — | — | not started |
| `/blog/highest-paying-digital-marketing-roles-in-india-2026-edition` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 97 | pass | 1 (answers 200) | — | — | not started |
| `/blog/why-our-students-are-2-steps-ahead-of-the-industry` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 98 | pass | 1 (answers 200) | — | — | not started |
| `/blog/video-seo-tiktok-youtube-shorts-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 99 | pass | 1 (answers 200) | — | — | not started |
| `/blog/optimized-local-brand-for-voice-search` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 98 | pass | 1 (answers 200) | — | — | not started |
| `/blog/death-of-keyword-understanding-user-intent-entities` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 100 | pass | 1 (answers 200) | — | — | not started |
| `/blog/ai-tools-every-digital-marketer-must-master-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 90 | pass | 1 (answers 200) | — | — | not started |
| `/blog/death-of-the-link-birth-of-the-answer-geo-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 131 | pass | 1 (answers 200) | — | — | not started |
| `/blog/digital-marketing-skills-next-generation-ai-era` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 143 | pass | 1 (answers 200) | — | — | not started |
| `/blog/digital-skills-education-6th-standard` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 110 | pass | 1 (answers 200) | — | — | not started |
| `/blog/grow-your-brand-social-media-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 132 | pass | 1 (answers 200) | — | — | not started |
| `/blog/seo-vs-paid-ads-career-growth` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 120 | pass | 1 (answers 200) | — | — | not started |
| `/blog/performance-marketing-skills-demand-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 121 | pass | 1 (answers 200) | — | — | not started |
| `/blog/new-age-seo-2026-marketing-strategy` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 91 | pass | 1 (answers 200) | — | — | not started |
| `/blog/mba-vs-digital-marketing-course-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 85 | pass | 1 (answers 200) | — | — | not started |
| `/blog/career-in-digital-marketing-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 94 | pass | 1 (answers 200) | — | — | not started |
| `/blog/ai-digital-marketing-career-2026` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 57 | pass | 1 (answers 200) | — | — | not started |
| `/courses/ai-integrated-digital-marketing-program` | Next.js (stays Main) | 200 / yes / index, follow / 16 / 1 / 110 | pass | 16 (answers 200) | — | — | stays on Next.js |
| `/tools/canva` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/figma` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/adobe-xd` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/photoshop` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/illustrator` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/pixlr` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/freshsales` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/mailchimp` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/brevo` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/convertkit` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/activecampaign` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/capcut` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/microsoft-ads` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/taboola` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/outbrain` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/criteo` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML; read again (first pass: connection error or browser timeout) | identical (text 100%) | not started |
| `/tools/adroll` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | status, title, description, canonical, robots, json_ld, text (missing e.g. "Acadvizen") (text 0%) | not started |
| `/tools/copy-ai` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/rytr` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/notion-ai` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/midjourney` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 1 (answers 200) | no H1 in the HTML; description shared with another address | identical (text 100%) | not started |
| `/tools/dalle` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML; description shared with another address | identical (text 100%) | not started |
| `/tools/veed` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/invideo` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/descript` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/loom` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/zapier` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 49 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/make` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 49 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/n8n` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 48 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/linkedin-ads` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/tiktok-ads` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/google-analytics` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/ga4` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 42 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/tag-manager` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/hotjar` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/clarity` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/mixpanel` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/amplitude` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/hubspot` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/zoho` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/salesforce` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/pipedrive` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 0 | no H1 in the HTML; read again (first pass: connection error or browser timeout) | identical (text 100%) | not started |
| `/tools/ahrefs` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 1 (answers 200) | no H1 in the HTML; read again (first pass: connection error or browser timeout) | identical (text 100%) | not started |
| `/tools/semrush` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/moz` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 42 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/ubersuggest` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML; read again (first pass: connection error or browser timeout) | identical (text 100%) | not started |
| `/tools/screaming-frog` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 1 (answers 200) | no H1 in the HTML; read again (first pass: connection error or browser timeout) | identical (text 100%) | not started |
| `/tools/surfer-seo` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 51 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/answer-the-public` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/google-search-console` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/mangools` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/serpstat` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/vistacreate` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 54 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/google-ads` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/meta-ads` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/wordpress` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/webflow` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/wix` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 42 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/shopify` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/squarespace` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 43 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/framer` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 52 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/carrd` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/chatgpt` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 53 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/claude` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 54 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/jasper` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 54 | pass | 1 (answers 200) | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/writesonic` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 54 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/tools/quillbot` | WordPress / Elementor | 200 / yes / index, follow / 14 / 0 / 54 | pass | 0 | no H1 in the HTML | identical (text 100%) | not started |
| `/digital-marketing-course-bangalore` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 1 / 85 | pass | 0 | description shared with another address | identical (text 100%) | stays on Next.js |
| `/digital-marketing-course-mysore` | Next.js (stays Main) | 200 / yes / index, follow / 12 / 1 / 85 | pass | 0 | description shared with another address | identical (text 100%) | stays on Next.js |
| `/blog/author/john-doe` | Next.js (stays Main) | 200 / yes / index, follow / 10 / 0 / 44 | pass | 0 | — | — | stays on Next.js |
| `/digital-marketing-courses-india` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-bangalore` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 112 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-mysore` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-jayanagar` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-jp-nagar` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-koramangala` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-indiranagar` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-mg-road` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 110 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-rajajinagar` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-rr-nagar` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-hsr-layout` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-whitefield` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |
| `/digital-marketing-courses-marathahalli` | Next.js (stays Main) | 200 / yes / index, follow / 14 / 1 / 109 | pass | 314 (answers 200) | — | — | stays on Next.js |

## LOCAL rehearsal: every migrated item

| ID | Type | Title | Destination | Outcome | Main address |
|---|---|---|---|---|---|
| 2182 | page/wp-page | AI Digital Marketing Course (Main) | main | verified | /ai-digital-marketing-course |
| 2183 | page/wp-page | Digital Marketing Internship In Bangalore (Main) | main | verified | /digital-marketing-internship-in-bangalore |
| 2174 | page/wp-page | Projects (Main) | main | verified | /projects |
| 2175 | page/wp-page | Soft Skills (Main) | main | verified | /soft-skills |
| 2176 | page/wp-page | Hire From Us (Main) | main | verified | /hire-from-us |
| 2177 | page/wp-page | Privacy Policy (Main) | main | verified | /privacy-policy |
| 2178 | page/wp-page | Terms of Service (Main) | main | verified | /terms-of-service |
| 2179 | page/wp-page | SEO Course In Bangalore (Main) | main | verified | /seo-course-in-bangalore |
| 2180 | page/wp-page | Social Media Marketing Course In Bangalore (Main) | main | verified | /social-media-marketing-course-in-bangalore |
| 2181 | page/wp-page | Google Ads Course In Bangalore (Main) | main | verified | /google-ads-course-in-bangalore |
| 2170 | page/wp-page | Acadvizen: Digital Marketing Course in Bangalore with AI Training (Main) | main | verified | / |
| 40 | page/wp-page | About (Main) | main | verified | /about |
| 2168 | acv_location | Contact Us | main | verified | /contact |
| 2172 | page/wp-page | Award-Winning Digital Marketing Training Institute in Karnataka – Empowering Future Marketers (Main) | main | verified | /achievements |
| 2173 | page/wp-page | Testimonials (Main) | main | verified | /testimonials |
| 2169 | page/wp-page | Blog (Main) | main | verified | /blog |
| 150 | acv_tool | Webflow | main | verified | /tools/webflow |
| 151 | acv_tool | Wix | main | verified | /tools/wix |
| 152 | acv_tool | WordPress | main | verified | /tools/wordpress |
| 153 | acv_tool | Writesonic | main | verified | /tools/writesonic |
| 154 | acv_tool | Zapier | main | verified | /tools/zapier |
| 155 | acv_tool | Zoho | main | verified | /tools/zoho |
| 148 | acv_tool | VEED | main | verified | /tools/veed |
| 149 | acv_tool | VistaCreate | main | verified | /tools/vistacreate |
| 137 | acv_tool | Salesforce | main | verified | /tools/salesforce |
| 138 | acv_tool | Screaming Frog | main | verified | /tools/screaming-frog |
| 139 | acv_tool | SEMrush | main | verified | /tools/semrush |
| 140 | acv_tool | Serpstat | main | verified | /tools/serpstat |
| 141 | acv_tool | Shopify | main | verified | /tools/shopify |
| 142 | acv_tool | Squarespace | main | verified | /tools/squarespace |
| 143 | acv_tool | Surfer SEO | main | verified | /tools/surfer-seo |
| 144 | acv_tool | Taboola | main | verified | /tools/taboola |
| 145 | acv_tool | Tag Manager | main | verified | /tools/tag-manager |
| 146 | acv_tool | TikTok Ads | main | verified | /tools/tiktok-ads |
| 147 | acv_tool | Ubersuggest | main | verified | /tools/ubersuggest |
| 134 | acv_tool | Pixlr | main | verified | /tools/pixlr |
| 135 | acv_tool | Quillbot | main | verified | /tools/quillbot |
| 136 | acv_tool | Rytr | main | verified | /tools/rytr |
| 127 | acv_tool | Mixpanel | main | verified | /tools/mixpanel |
| 128 | acv_tool | Moz | main | verified | /tools/moz |
| 129 | acv_tool | n8n | main | verified | /tools/n8n |
| 130 | acv_tool | Notion AI | main | verified | /tools/notion-ai |
| 131 | acv_tool | Outbrain | main | verified | /tools/outbrain |
| 132 | acv_tool | Photoshop | main | verified | /tools/photoshop |
| 133 | acv_tool | Pipedrive | main | verified | /tools/pipedrive |
| 117 | acv_tool | Jasper | main | verified | /tools/jasper |
| 118 | acv_tool | LinkedIn Ads | main | verified | /tools/linkedin-ads |
| 120 | acv_tool | Loom | main | verified | /tools/loom |
| 121 | acv_tool | Mailchimp | main | verified | /tools/mailchimp |
| 122 | acv_tool | Make | main | verified | /tools/make |
| 123 | acv_tool | Mangools | main | verified | /tools/mangools |
| 124 | acv_tool | Meta Ads | main | verified | /tools/meta-ads |
| 125 | acv_tool | Microsoft Ads | main | verified | /tools/microsoft-ads |
| 126 | acv_tool | Midjourney | main | verified | /tools/midjourney |
| 116 | acv_tool | InVideo | main | verified | /tools/invideo |
| 108 | acv_tool | Freshsales | main | verified | /tools/freshsales |
| 109 | acv_tool | GA4 | main | verified | /tools/ga4 |
| 110 | acv_tool | Google Ads | main | verified | /tools/google-ads |
| 111 | acv_tool | Google Analytics | main | verified | /tools/google-analytics |
| 112 | acv_tool | Google Search Console | main | verified | /tools/google-search-console |
| 113 | acv_tool | Hotjar | main | verified | /tools/hotjar |
| 114 | acv_tool | HubSpot | main | verified | /tools/hubspot |
| 115 | acv_tool | Illustrator | main | verified | /tools/illustrator |
| 101 | acv_tool | ConvertKit | main | verified | /tools/convertkit |
| 102 | acv_tool | Copy.ai | main | verified | /tools/copy-ai |
| 103 | acv_tool | Criteo | main | verified | /tools/criteo |
| 104 | acv_tool | DALL·E | main | verified | /tools/dalle |
| 105 | acv_tool | Descript | main | verified | /tools/descript |
| 106 | acv_tool | Figma | main | verified | /tools/figma |
| 107 | acv_tool | Framer | main | verified | /tools/framer |
| 99 | acv_tool | Clarity | main | verified | /tools/clarity |
| 100 | acv_tool | Claude | main | verified | /tools/claude |
| 91 | acv_tool | Ahrefs | main | verified | /tools/ahrefs |
| 92 | acv_tool | Amplitude | main | verified | /tools/amplitude |
| 93 | acv_tool | AnswerThePublic | main | verified | /tools/answer-the-public |
| 94 | acv_tool | Brevo | main | verified | /tools/brevo |
| 95 | acv_tool | Canva | main | verified | /tools/canva |
| 96 | acv_tool | CapCut | main | verified | /tools/capcut |
| 97 | acv_tool | Carrd | main | verified | /tools/carrd |
| 98 | acv_tool | ChatGPT | main | verified | /tools/chatgpt |
| 88 | acv_tool | ActiveCampaign | main | verified | /tools/activecampaign |
| 89 | acv_tool | Adobe XD | main | verified | /tools/adobe-xd |
| 90 | acv_tool | AdRoll | main | verified | /tools/adroll |
| 87 | elementor_library/section | Main — Tool card | main | verified | — |
| 86 | elementor_library/page | Main — Tool page design | main | verified | — |
| 2096 | elementor_library/section | Main — Blog card | main | verified | — |
| 2097 | elementor_library/page | Main — Blog post design | main | verified | — |
| 2098 | elementor_library/page | Main — Location &#038; service page design | main | verified | — |
| 2099 | elementor_library/section | Main — Homepage blog card | main | verified | — |
| 84 | elementor-hf/wp-post | Main Website Header | main | verified | — |
| 85 | elementor-hf/wp-post | Main Website Footer | main | verified | — |
| 2167 | acv_blog | Google Ads AI Max Explained: What the September 2026 Auto-Upgrade Changed | main | verified | /blog/google-ads-ai-max-explained-what-the-september-2026-auto-upgrade-changed |
| 2091 | elementor_library/popup | Quick Registration popup (Main homepage) | main | draft | — |
