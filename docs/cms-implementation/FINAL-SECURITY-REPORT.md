# Final security report: Acadvizen Master Admin / headless CMS (13 October 2026)

No secret value appears in this report, in the repository, or in any evidence file. Scans compare values privately and print only variable names, file paths and commit IDs.

**Status labels:**
- `PASS — VERIFIED` (production)
- `PASS — VERIFIED LOCALLY ONLY`
- `BLOCKED — EXTERNAL ACTION REQUIRED`
- `OWNER APPROVAL REQUIRED`
- `FAIL — FIX REQUIRED`
- `ACCEPTED RESIDUAL RISK`

## Owner decision on existing credentials (recorded once)

On 13 October 2026 the owner instructed that **existing passwords and keys must not be changed, rotated, revoked or deleted** during this work. This covers:
- the Supabase service-role key;
- the production database password;
- the Main admin password;
- every other password.

The engineer followed this instruction. No credential was changed, rotated or revoked, and no replacement credential was created.

**What this means:**
- **The exposures C1–C4 below are NOT remediated.** They remain active risks, recorded as `ACCEPTED RESIDUAL RISK` by the owner's decision.
- **The security gate stays open** until the owner chooses to rotate.

## 1. Credential exposure

| # | Credential (category) | Where exposed | In current files | Status |
|---|---|---|---|---|
| C1 | Supabase **service-role key** (legacy JWT; full read/write of all Main data, including leads) | Public Git history: commits `07fb544`, `e0207ee`, on all 17 branches including `main`. The repository `Lavanyaraju19/Acadvizen-newww` is **public** (checked 12 Oct) | No | `ACCEPTED RESIDUAL RISK` (owner decision). Still valid; not rotated |
| C2 | **Production database password** | Public history: `e0207ee` | Removed 12 Oct (`8535030`) | `ACCEPTED RESIDUAL RISK`. Removing it from the current files does not remove it from history |
| C3 | **Main admin password** | Public history: 4 commits (`5dd9b15` … `e0207ee`) | No | `ACCEPTED RESIDUAL RISK` |
| C4 | Another admin password (`ADMIN_PASSWORD`) | Public history: 3 commits | No | `ACCEPTED RESIDUAL RISK` (if that account still exists) |
| C5 | Supabase anon key | Public history | No | Not secret (served in every public page) |
| C6 | Content-API shared secret | Not exposed (history scan clean) | No | `PASS — VERIFIED`. Kept in the private credentials file, Vercel Production (Sensitive) and `wp-config.php` |
| C7 | WordPress, Hostinger, FTP and Vercel credentials shared in chat during the project | Chat transcripts | No | `ACCEPTED RESIDUAL RISK` (owner decision) |
| C8 | WordPress integration account | Its username is the example name from the docs (public history, `dde1328`) | Removed from current docs | `OWNER APPROVAL REQUIRED` (a new password or a new account) |
| C9 | `%TEMP%\acadvizen-production-verify.env` (a `vercel env pull` copy with production secrets) | This PC | Outside Git | `PASS — VERIFIED` removed 12 Oct 19:47 UTC, after confirming it was unreferenced and redundant. Still absent 12 Oct 20:07 UTC. **If an editor tab still shows it, do not save that tab**: saving would recreate the file |

## 2. Mitigations implemented in this work (no credential changed)

| Item | What was done | Evidence | Status |
|---|---|---|---|
| Key-rotation readiness | Every server read now goes through `lib/supabaseServiceKey.js`, which prefers `SUPABASE_SECRET_KEY` but uses it **only when the value has the shape of a server key** (`sb_secret_…` or a `service_role` JWT). An empty, malformed or publishable value falls back to the working legacy key. The `/admin` notification routes answer a clean 503 if no key is configured, instead of calling Supabase without one | `tests/unit/supabase-key-rotation.test.js` (7 tests: positive, negative, empty, static guards) | `PASS — VERIFIED LOCALLY ONLY` |
| Proof that Main runs on the new key type | Local Main built and run with **only** `sb_publishable_…` / `sb_secret_…` keys (legacy variables unset). Results: `/admin` sign-in and the notifications API (6/6); every WordPress acceptance suite (structured 56, site chrome 18, homepage 14, courses 12, more-content 15, permissions 9, scheduling 7, blogs 16, pages 17, signed API 16); no key value in the browser bundle | `evidence/newkeys-local/` | `PASS — VERIFIED LOCALLY ONLY` (no new production key exists, by decision) |
| Dependencies | `nodemailer` 9.1.1 → 10.1.0 (5 advisories; the mailer is not reachable on production because no `SMTP_*` variables are set there). Next.js's own `sharp` 0.34.5 → 0.35.5 (libvips, libheif and librsvg CVEs) through a package override. `npm audit --omit=dev`: **0 vulnerabilities** (was 2 high) | Final run log; mailer unit tests 11/11 | `PASS — VERIFIED LOCALLY ONLY` (deploys with release 11) |
| Temporary secret copy | C9 removed | above | `PASS — VERIFIED` |
| Credentials file format (O-10) | The SSH host was joined onto the shared-secret line; it is now on its own line. Both values were verified unchanged before and after writing. Permissions remain SYSTEM, Administrators and the owner only; the file is outside the repository. A signed production request with the reformatted file → 200 | — | `PASS — VERIFIED` |

## 3. Integration and platform security checks

Production checks ran 12 Oct 19:41–20:25 UTC against `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` with plugin 0.6.1.

| Area | Finding | Status |
|---|---|---|
| Signed content API | Unsigned → 401 `missing_timestamp`; wrong secret → 401 `invalid_signature`; stale → 401 `stale_timestamp`; wrong purpose → 400; unknown entity → 400; signed read-only list → 200; replay → 409 (12 Oct run) | `PASS — VERIFIED` |
| Address (slug) check | Free address → no conflict; `/blog` → conflict "reserved"; `/a/../b` → 400 `invalid_path`. Unit tests: 11 malformed forms refused; renaming onto a taken address refused | `PASS — VERIFIED` |
| Preview framing | `frame-ancestors 'self' https://enroll.acadvizen.com` on `/preview/wordpress/…` only; `'none'` elsewhere | `PASS — VERIFIED` |
| Public JavaScript | 30 chunks from 6 pages (including `/admin`, `/admin-login`): 0 private values, 0 secret patterns, no non-anon JWT. Source maps → 404 | `PASS — VERIFIED` |
| Main admin | `/admin` signed out = noindex shell without data; `/api/admin/notifications` GET/POST signed out → 401 | `PASS — VERIFIED` |
| Render Bridge | Off: `WORDPRESS_CONTENT_ENABLED` absent in every Vercel environment; `/api/wordpress/bridge-manifest` → 404 | `PASS — VERIFIED` |
| Vercel variable scope | Production holds the 10 required names. Preview and Development hold only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public values): **no production secret is exposed to Preview or Development** | `PASS — VERIFIED` |
| Plugin REST | Unsigned `/manifest` → 401; `/blogs` returns only published, Main-visible posts | `PASS — VERIFIED` |
| WordPress roles | Author and Contributor: only Blogs opens; Settings, Main media upload and the plugin installer are refused (403). Authors publish only their own posts; Contributors cannot publish | `PASS — VERIFIED LOCALLY ONLY` (no such accounts on production) |
| Integration account | WordPress user ID 2, Administrator role (needed to install and configure the plugin). It holds no Main credential; the shared secret lives in `wp-config.php`. Least-privilege option: an Editor account for daily publishing, keeping the Administrator for maintenance | `OWNER APPROVAL REQUIRED` (account changes are not made without approval) |
| Plugin provenance | Installed 0.6.1; the 4 publicly served plugin files are byte-identical to package `dd6fcf27…e32c`; plugin source unchanged since `2cc2148`, so no version bump is needed | `PASS — VERIFIED` |
| Two editors (plugin 0.7.0 + Main release 11; LOCAL) | Saves carry the version they opened; a changed record is refused (`edit_conflict`) with one conditional update, so nothing is silently overwritten. Blog sync never overwrites a side changed since the last alignment, never deletes across websites, and stops if Main suddenly lists no blogs. "Also publish on the Main Website" needs the WordPress capability to publish (a Contributor is refused) | `PASS — VERIFIED LOCALLY ONLY` |
| Redirects from WordPress (LOCAL) | System addresses (`/admin`, `/api`, `/login` …) cannot be redirected; no loops, chains or duplicates; a published page or blog can never be hidden; redirects start switched off, are re-checked when switched on, and are deleted only when off and confirmed | `PASS — VERIFIED LOCALLY ONLY` |
| Repository guard | Pre-commit secret hook (ran on every commit of this work: clean); GitHub "Secret scan" workflow; `.env*` and `.vercel` ignored | `PASS — VERIFIED` |

## 3a. Approval, roles, typed code and third-party widgets (plugin 0.7.0; LOCAL, not installed on production)

| Area | Control | Evidence | Status |
|---|---|---|---|
| Who may approve | New capability `acv_review_publication`: Administrators, plus the new role **Reviewer (approves publishing)**. Editors, Authors and Contributors can submit but never approve; refused both from the screen and from a direct call (`not_reviewer`) | `approval-acceptance.mjs` A4, A10; PHP tests | `PASS — VERIFIED LOCALLY ONLY` |
| Approval tied to the revision | SHA-256 fingerprint over title, content, excerpt, order, parent, the design and page settings, template, featured image, Publish To, Main address, replace and homepage flags, terms, the referenced media files (name, size, time) and the global styles. Any change cancels the approval; publishing re-checks the fingerprint | A5; PHP tests (fingerprint, state machine) | `PASS — VERIFIED LOCALLY ONLY` |
| Live documents cannot be changed directly | Refused on every route: Elementor save (`elementor/document/before_save`), REST/block editor (`rest_pre_insert_*` → 403 `acv_live_needs_approval`), classic/quick/bulk edit (`wp_insert_post_data`), trash and delete by non-reviewers. Opening a live page opens its working copy | A7 | `PASS — VERIFIED LOCALLY ONLY` |
| Bulk changes | Import Main Website goes through approval: new records are submitted; live records are written to working copies | A15 | `PASS — VERIFIED LOCALLY ONLY` |
| Global styles | The Elementor kit changes both websites at once: reviewers only, each save recorded | A12 | `PASS — VERIFIED LOCALLY ONLY` |
| Typed code | The CMS never executes administrator-supplied PHP or JavaScript itself. Elementor HTML, Shortcode and Custom HTML widgets are classed **code**: approval needs a reviewer with `unfiltered_html` who ticks "I checked the code" (`code_needs_review` otherwise) | A11; registry PHP tests | `PASS — VERIFIED LOCALLY ONLY` |
| Third-party widgets | Unknown add-ons are **review** on Main. Shop (WooCommerce, ShopEngine) and Login widgets are **blocked** on Main (they would post to WordPress through Main). A widget whose plugin is inactive blocks approval instead of silently disappearing | `WIDGET-COMPATIBILITY.md`; A11 | `PASS — VERIFIED LOCALLY ONLY` |
| SEO in the approved revision | Rank Math or Yoast titles, descriptions, canonical, robots, social and schema fields, and the imported JSON-LD are part of the fingerprint: a changed SEO field cancels the approval and blocks publishing | `approval-reliability-acceptance.mjs` R6; PHP | `PASS — VERIFIED LOCALLY ONLY` |
| Navigation shown on Main | With approval on, only reviewers can save a menu marked as a Main menu (Appearance → Menus 403, REST 403 `acv_main_menu_needs_reviewer`); Customizer menus are hidden from non-reviewers; saves are recorded. Enrollment-only menus are unchanged | R7 | `PASS — VERIFIED LOCALLY ONLY` |
| Main-only rollback | "Make live" of an earlier Main version: reviewers only under approval, recorded | R8 | `PASS — VERIFIED LOCALLY ONLY` (pending the R8 run) |
| Preview confirmation | Approval requires the reviewer to confirm the preview of each chosen website (both for Both); recorded with the approval | A5; PHP | `PASS — VERIFIED LOCALLY ONLY` |
| One live page per Main address | A page cannot be submitted for a Main address another live page already serves (`main_address_in_use`); the importer updates the page already serving an address instead of creating a second one | Site-wide migration run (LOCAL) | `PASS — VERIFIED LOCALLY ONLY` |
| Empty designs | An Elementor page or template with an empty design is blocked from approval ("it would show nothing"); the importer never imports an empty design over an existing one; the converter leaves such parts out with a note | PHP; site-wide migration run | `PASS — VERIFIED LOCALLY ONLY` |
| Replays and forged requests | Approvals actions carry user-bound nonces. A repeated or replayed publish is refused and publishes nothing twice. A publish with a wrong nonce, and another user replaying a reviewer's approve link, are refused (403) | `approval-reliability-acceptance.mjs` R3 | `PASS — VERIFIED LOCALLY ONLY` |
| Scheduled publishing | Only an approved, unchanged revision is scheduled. The job re-checks the fingerprint when it runs and refuses a changed revision. A scheduled revision cannot be published early | R4; PHP state-machine tests | `PASS — VERIFIED LOCALLY ONLY` |
| What Main forwards to WordPress | Only the allow-listed form endpoints (enquiry, CF7, MetForm, Elementor Pro forms) and static assets; path traversal refused | `tests/unit/wordpress-bridge-support.test.js` | `PASS — VERIFIED` (unit) |
| Admin actions | Every Approvals action is a nonce-checked `admin-post` request with a capability check per action. Revision marks in public pages are 16 hex characters of the fingerprint, with no personal data | Code review; A9 drives the real button | `PASS — VERIFIED LOCALLY ONLY` |
| Audit trail | Submit, approve (including self-approval, flagged), reject with note, invalidation by edit, publish, verification result, retry, rollback, homepage moves, global-styles saves, working-copy creation and discard: who, when, revision. Latest 1,000 entries | Approvals → History | `PASS — VERIFIED LOCALLY ONLY`. O-27 (retention) |
| Not covered by approval | Main Website structured screens, menus, Rank Math/plugin settings, WordPress widgets, **WPCode snippets** and **PopupKit popups** (both on production) take effect when saved | — | `KNOWN LIMITATION` (O-22): keep these to Administrators |

## 4. Local machine

| Item | Finding | Status |
|---|---|---|
| Private credentials file | SYSTEM, Administrators and the owner's account only | `PASS — VERIFIED` |
| Project `.env.local` | Also writable by a `CodexSandboxUsers` group and four sandbox SIDs (another coding tool's sandbox). It holds **no production private value** (compared privately). Not changed: removing those entries could break that tool, and the file holds only local values | `ACCEPTED RESIDUAL RISK` (low). Optional owner step: remove those entries with `icacls` |
| VS Code extension storage | An AI extension (Blackbox) keeps a copy of `.env.local` | Optional owner step |

## 5. Residual risk (open by the owner's decision; not remediated)

Anyone who reads the public Git history has:
- full read/write access to the Main database through the API (C1), including leads;
- direct database access (C2);
- `/admin` access (C3).

This exposure has existed since those commits were pushed, and it ends only when those credentials are rotated.
- **Code readiness for that rotation is done** (release 11) and proven on the new key type locally.
- **History rewriting is not proposed.** It would need a force-push of every branch, and copies already cloned cannot be recalled.

## 6. Rotation and verification plan (treat C1–C4 and C7 as compromised; NOT executed, owner-controlled)

Each step is reversible until the old value is revoked. Never paste a new value into chat, Git, a document or a screenshot; enter it only in the provider's console, in Vercel (Sensitive), and in the private credentials file.

| Order | Credential | Steps | Verify | Downtime |
|---|---|---|---|---|
| 1 | Prerequisite | Release 11 is live (key picker in every server read) | `/admin` notifications load; smoke tests | none |
| 2 | **C1 service-role key** | Supabase → Project Settings → API Keys → create a **secret key**. Vercel Production → add `SUPABASE_SECRET_KEY` (Sensitive) → Redeploy | `/`, `/blog`, `/tools/ahrefs` 200; `/admin` sign-in and notifications; WordPress "Test connection"; one signed read-only list (`tools/verify-content-api-live.mjs` without writes) | none (both keys valid) |
| 3 | C1 revoke | Supabase → API Keys → **disable the legacy JWT keys** (this revokes the leaked service-role key and the old anon key) | The same checks again. A request with the old key must now fail (Supabase dashboard API logs, or a REST call with the old key from the private file → 401). Then remove `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Vercel | none if step 2 passed; rollback = re-enable legacy keys |
| 4 | **C2 database password** | Supabase → Project Settings → Database → **Reset database password** | The websites keep working (Vercel holds no database password); local scripts read `SUPABASE_DB_PASSWORD` | none |
| 5 | **C3, C4 admin passwords** | `www.acadvizen.com/admin` → profile → change password (or Supabase → Authentication → Users → reset). Remove accounts that are no longer needed | Sign in with the new password; the old one is refused | none |
| 6 | **C7 chat-shared credentials** | Hostinger account, WordPress administrators (including the integration account, C8), FTP/SFTP, Vercel account and tokens | Each sign-in works with the new value; WordPress "Test connection" still Connected (the shared secret C6 is separate and was not exposed) | none |
| 7 | History | Not rewritten (force-push of every branch; existing clones keep the values). Rotation makes the exposed values useless | GitHub secret-scan workflow stays green | — |

**Progress on 14 October 2026 (owner asked for remediation):**
- Step 1 is done: release with the key picker live (commit `7f1a75f`).
- Step 2 is done, using an existing new-style secret key that was never in Git; Vercel production `SUPABASE_SECRET_KEY` (Sensitive) is set.
- Also fixed: Vercel's `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` held the legacy anon JWT; it now holds the real publishable key.
- Verified on production:
  - signed content API 16/16;
  - browsers get the publishable key;
  - 0 browser scripts contain a legacy JWT.
- **Still open, owner:**
  - step 3: disable the legacy JWT keys, the step that actually revokes the leaked key;
  - step 4: reset the database password;
  - steps 5–6: other passwords.

  Until step 3 is done, the leaked service-role key **remains valid**: this is an open security issue, not an accepted risk.
- **Owner instruction for the 14 Oct release:** do not disable the legacy keys or reset the database password in this run. They therefore remain **valid and exposed**. Main does not use them (verified). Do not reintroduce them anywhere, and do not roll Main back to a deployment that uses them (`DEPLOYMENT-REPORT.md` §0).
