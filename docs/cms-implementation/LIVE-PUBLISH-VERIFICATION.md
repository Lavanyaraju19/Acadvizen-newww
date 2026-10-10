# Live publication verification

## Status on 10 October 2026: no production publication has been made yet (BLOCKED)

A publication from WordPress to the live Main website needs all of the following. Each item shows its state at 15:05 UTC.

| Requirement | State |
|---|---|
| Plugin active on enroll.acadvizen.com | **Done** (0.4.0, verified) |
| Shared secret in `wp-config.php` (`ACADVIZEN_CMS_WEBHOOK_SECRET`) and the Main address (`ACADVIZEN_CMS_MAIN_URL`) | Not set (the signed routes refuse everything) |
| The same secret and `WORDPRESS_CMS_API_URL` in Vercel production | Not set (checked by name) |
| `WORDPRESS_CONTENT_ENABLED=true` and a redeploy | Off, deliberately, until the signed checks pass |
| Server cron every minute | Not known (hPanel) |
| A WordPress admin login for the engineer, or the owner doing the steps | Not available to the engineer |
| Enrollment backup with date and scope | Not confirmed |

Until these are done, **nothing published in WordPress can appear on www.acadvizen.com**. Pages set to Enrollment work as normal WordPress pages.

## Protocol for each production publication (to be recorded here)

For each test item (`CMS PRODUCTION TEST YYYYMMDD-HHMM`, noindex, not in menus):

1. **Status:** WordPress → Acadvizen Master Admin → Publishing shows "Main: Published (version N)". Record N and the time.
2. **Backend record:** `node tools/cms-api-smoke.mjs` with the secret in the environment. The signed manifest lists the page's path with version N.
3. **Cache:** the Main response header `X-Acadvizen-Render-Version` equals N. Use a fresh browser context.
4. **Public URL:** answers 200. Record the title, canonical and robots meta.
5. **Rendered output:** a full-page screenshot in `evidence/` named `live-<test>-<site>-<time>.png`. Check the content, colours and layout.
6. **Images and links:** every `<img>` loads, and internal links answer 200.
7. **Destination:** Enrollment answers 404 for Main-only and 200 for Enrollment/Both. Main answers 404 for Enrollment-only.
8. **Unrelated routes:** `node tools/verify-production.mjs` is no worse than the baseline.
9. **Cleanup:** delete the item, then confirm 404 on both websites and that it is gone from both sitemaps.

## What has been verified (not production)

The same protocol was run end to end on the local test system (`tests/wordpress`, 44/44): publish, edit, Both, rollback, global colour, city/area pages, failure and retry. Those results are LOCAL evidence only. Screenshots of the local preview are not used as proof of a production publication.
