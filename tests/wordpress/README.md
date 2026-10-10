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

The plugin is mounted read-only from `wordpress/acadvizen-cms`, so the tests always run the current source. `mu-plugins/` holds two local-only helpers:
- one lets WordPress call the Main server on the Docker host;
- one switch simulates a failing render.

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
