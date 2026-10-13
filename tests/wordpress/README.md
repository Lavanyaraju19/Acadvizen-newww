# Local end-to-end tests: WordPress plugin + Main Website

A throwaway WordPress in Docker and a local production build of the Main Website, connected the way production will be. Nothing here touches a real website. Use a local test secret only, never a production or staging one.

## 1. WordPress (port 8088)

```sh
cd tests/wordpress
export ACV_SECRET="local-test-$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")"
docker compose up -d wordpress
docker compose run --rm cli core install --url=http://localhost:8088 --title="ACV local" --admin_user=admin --admin_password="$(node -e "console.log(require('crypto').randomBytes(12).toString('hex'))")" --admin_email=admin@example.invalid --skip-email
docker compose run --rm cli rewrite structure '/%postname%/'
docker compose run --rm cli theme install astra --activate
docker compose run --rm cli plugin install elementor header-footer-elementor seo-by-rank-math contact-form-7 --activate
docker compose run --rm cli plugin activate acadvizen-cms
```

The plugin is mounted read-only from `wordpress/acadvizen-cms`, so the tests always run the current source. `mu-plugins/` holds local-only helpers:
- one lets WordPress call the Main server on the Docker host;
- one switch simulates a failing render;
- `0-local-render-bridge.php` turns on the native Elementor publishing screens (`ACADVIZEN_CMS_RENDER_BRIDGE`);
- `0-local-approval.php` turns on approval (`ACADVIZEN_CMS_APPROVAL`) only while the option `local_approval_on` is set. The approval test sets it for its own run, so the other suites keep publishing without approval.

## 2. Main Website (port 3100), integration on

```sh
WORDPRESS_CONTENT_ENABLED=true \
WORDPRESS_CMS_API_URL=http://localhost:8088/wp-json/acadvizen-cms/v1 \
WORDPRESS_CMS_WEBHOOK_SECRET="$ACV_SECRET" \
  sh -c 'npx next build && npx next start -p 3100'
```

The variables are read at build time. Afterwards, build again without them to get back the normal (integration off) build.

## 3. Run

```sh
node tests/wordpress/scenarios.mjs        # all scenarios, about 10 minutes
node tests/wordpress/scenarios.mjs AF     # only some
CMS_API_URL=http://localhost:8088/wp-json/acadvizen-cms/v1 WORDPRESS_CMS_WEBHOOK_SECRET="$ACV_SECRET" node tools/cms-api-smoke.mjs
```

| Scenario | What it proves |
|---|---|
| L | Deactivate and activate in WordPress. `.htaccess` stays unchanged, recurring jobs are removed and restored, the API namespace goes and returns, and the version table exists. The optional features stay off |
| A | Main only: a draft is not public anywhere. A layout and colour change can be previewed as on Main before publishing. Publishing serves it on Main, not on Enrollment, and puts it in Main's sitemap |
| B | Enrollment only: shown on Enrollment, never on Main |
| C | Both, then a change on both, then switched to Main only (removed from Enrollment) |
| D | Global redesign: the Elementor global primary colour reaches Main (site-wide re-render) and Enrollment. A page's own background is kept |
| E | City → area (taxonomy), an area page previewed and published on Main, hidden on Enrollment. An address change gives a 301 from the old address |
| F | Recovery: v1 → v2 (other text, colour and layout) → rollback brings back v1's text **and** design → the next update replaces the rollback |
| H | Failure: a render fails, Main keeps the previous version and the error is recorded. A retry publishes the new version |

Due jobs are run the way the production server cron does (every minute), because an idle local site gets no visits to start WordPress's own cron. Everything a run creates is deleted at the end, and the global colour is restored.

To use an existing stack in another folder, set `ACV_WP_COMPOSE_DIR`.

### Approval before publishing (`approval-acceptance.mjs`, about 6 minutes)

Needs the stack above with the Render Bridge build of Main. It also needs an administrator login (`WP_ADMIN_USER`, `WP_ADMIN_PASS`) and a file holding a password for the Editor account the test creates (`EDITOR_PASS_FILE`). Generate that password locally; never use a real one.

```sh
WP_ADMIN_USER=… WP_ADMIN_PASS=… EDITOR_PASS_FILE=./.editor-pass node tests/wordpress/approval-acceptance.mjs
# DUMP_DIR=<folder> also saves the page HTML and desktop/tablet/phone screenshots of both websites
```

| Step | What it proves |
|---|---|
| A0–A3 | An image uploaded to the media library and a page built in the real Elementor editor (nested containers, typography, responsive sizes, button, image). Drafts are not public. "Publish" by an Editor only submits that exact revision |
| A4 | Editors cannot approve, from the screen or by a direct call. Administrators can |
| A5 | An edit after approval cancels it, and the cancelled revision cannot be published |
| A6 | Main only: published and **verified** by the revision mark on the Main page; not on Enrollment |
| A7 | A live page opens as its working copy. Elementor saves, REST saves and trashing of the live page are refused |
| A8 | Both: verified on both websites. Layout and responsive font sizes are checked at 1440, 820 and 390 px on both websites. An archive of the previous revision is kept |
| A9 | Main failing during Both: **partial failure** naming Main, Main keeps the previous revision, and **Check again** recovers |
| A10 | Rollback to the archived revision (reviewers only), verified on both websites |
| A11 | A missing widget blocks submission with the reason. Typed HTML needs an explicit code review |
| A12 | Global styles: reviewers only |
| A13 | Both homepages still answer as before |
| A14 | "Main homepage" ticked on a draft changes nothing until that page is approved and published |
| A15 | Import Main Website under approval: submitted, not published. Re-importing a live page writes its working copy. The importer never finds the copy. A page's own copy does not count as another page using its Main address |
| Z | Everything the run created is removed, and approval is switched off again |

### Reliability under approval (`approval-reliability-acceptance.mjs`, about 6 minutes)

Same setup and variables as above. The local switch in `mu-plugins/local-failure-switch.php` makes Enrollment fail only for the verifier's own requests (`local_force_enroll_error`).

| Step | What it proves |
|---|---|
| R1 | Enrollment failing during Both: a partial failure naming Enrollment; **Check again** retries only that website and recovers |
| R2 | Both failing: reported as failed with each website named; one **Check again** recovers both |
| R3 | A repeated or replayed publish is refused (no duplicate, no extra archive). A wrong nonce, and another user replaying a reviewer's approve request, are refused |
| R4 | Scheduled publishing: "Schedule approved revision for …", not public before its time, not publishable early, a lost job restored, a changed revision refused when its time comes, Cancel schedule, published and verified when due, all in the history |
| R5 | Approval switched off: an approved but unpublished page does not go live, the Approvals screen goes away, and live pages stay |

### Moving a real Main page into Elementor (`migration-acceptance.mjs`, about 4 minutes)

```sh
MSYS_NO_PATHCONV=1 node tools/main-to-elementor/build-bundle.mjs --main http://localhost:3100 --only pages --paths /soft-skills --out bundle.json
BUNDLE=bundle.json MIGRATE_PATH=/soft-skills node tests/wordpress/migration-acceptance.mjs
```

The test runs **Import Main Website** under approval, then has a reviewer approve and publish the page over its Main address. It compares the page with the original: every content line, the H1, title, description and canonical, phone overflow and pixel difference. It then takes the page off line (Main's own page must come back) and undoes the import.

Rank Math must be set up for titles to be compared. On a fresh local WordPress, skip its registration with `wp option update rank_math_registration_skip 1`, as the setup wizard's "Skip" does.

## 4. Main Website screens: non-technical admin acceptance (`structured-acceptance.mjs`)

This test needs a different Main set-up: Main must be connected to a **local Supabase**, never the production one, because the test edits, publishes and deletes records.

1. Start the local Supabase for this repository and apply every migration:
   ```sh
   npx supabase@2.120.0 start
   npx supabase@2.120.0 migration up --local
   ```
   Add the visibility columns production has, if the local tables lack them: `published` on `tools_extended`, `locations` and `testimonials`.
2. Seed one existing page with sections. By default the address is `seo-course-in-bangalore`; change it with `TEST_PAGE_SLUG`. A copy of a production page gives the most realistic check.
3. Build and start Main against the local Supabase. Set these at build **and** run time:
   ```sh
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321 NEXT_PUBLIC_SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… \
   WORDPRESS_CONTENT_API_ENABLED=true WORDPRESS_CMS_WEBHOOK_SECRET="$ACV_SECRET" \
     sh -c 'npx next build && npx next start -p 3100'
   ```
   Use the local keys printed by `supabase start`. Leave `WORDPRESS_CONTENT_ENABLED` unset.
4. In WordPress, create one Author and one Contributor, then run:
   ```sh
   WP_ADMIN_USER=… WP_ADMIN_PASS=… WP_AUTHOR_USER=… WP_AUTHOR_PASS=… \
   WP_CONTRIBUTOR_USER=… WP_CONTRIBUTOR_PASS=… WORDPRESS_CMS_WEBHOOK_SECRET="$ACV_SECRET" \
     node tests/wordpress/structured-acceptance.mjs
   ```
   It takes about 25 minutes. Run nothing heavy (builds, other test suites) at the same time: the browser steps time out under load.

The groups (A, B, D/E, E, I, H, J, Z) are described in `docs/cms-implementation/TEST-PLAN.md`. Screenshots and `results-<run>.json` are written to `docs/cms-implementation/evidence/local-structured/`. Everything the run creates is deleted at the end (group Z).

Headless Chromium on Windows sometimes stops painting wp-admin. When a normal click or tick does not happen within 4 s, the test sends the same DOM event. The results JSON counts these as `click_fallbacks`.
