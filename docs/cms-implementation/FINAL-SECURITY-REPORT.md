# Final security report: Acadvizen Master Admin / headless CMS (13 October 2026)

No secret value appears in this report, in the repository, or in any evidence file. Scans compare values privately and print only variable names, file paths and commit IDs.

## Owner decision on existing credentials (recorded once)

On 13 October 2026 the owner instructed that **existing passwords and keys must not be changed, rotated, revoked or deleted** as part of this work. This covers:
- the Supabase service-role key;
- the production database password;
- the Main admin password;
- every other password.

The engineer followed this instruction. No credential was changed, rotated or revoked, and no replacement credential was created.

**What this means:**
- **The exposures in C1–C4 below are NOT remediated.** They remain active risks.
- **The security gate stays open (FAILED)** until the owner chooses to rotate.

This report does not claim otherwise.

## 1. Credential exposure

| # | Credential (category) | Where exposed | In current files | Changed / revoked | Status |
|---|---|---|---|---|---|
| C1 | Supabase **service-role key** (legacy JWT; full read/write of all Main data, including leads) | Public Git history: commits `07fb544`, `e0207ee`, on all 17 branches including `main`. The repository `Lavanyaraju19/Acadvizen-newww` is **public** (checked 13 Oct) | No | No (owner decision) | **OPEN, critical, residual risk** |
| C2 | **Production database password** (project `hhfc…`) | Public history: `e0207ee` (12 scripts) | Removed 12 Oct (`8535030`); scripts read `SUPABASE_DB_PASSWORD` | No (owner decision) | **OPEN, critical, residual risk** |
| C3 | **Main admin password** (working `/admin` account) | Public history: 4 commits (`5dd9b15` … `e0207ee`) | No | No (owner decision) | **OPEN, critical, residual risk** |
| C4 | Another admin password (`ADMIN_PASSWORD`) | Public history: 3 commits | No | No (owner decision) | OPEN, high (if that account still exists) |
| C5 | Supabase anon key | Public history (4 commits) | No | n/a | Not secret (it is in every public page) |
| C6 | Content-API shared secret | **Not exposed** (history scan clean) | No | n/a | OK. Kept in the private credentials file, Vercel (Sensitive) and `wp-config.php` |
| C7 | WordPress passwords, Hostinger login, FTP, Vercel token (shared in chat during the project) | Chat transcripts | No | No (owner decision); one WordPress password was changed by the owner on 12 Oct | OPEN, high, residual risk |
| C8 | WordPress integration account | Its username is the example name from the docs (in public history, `dde1328`) | Removed from current docs | n/a | OPEN, medium |
| C9 | `%TEMP%\acadvizen-production-verify.env` (a `vercel env pull` copy holding production secrets) | This PC only | Outside Git | n/a | **CLOSED 12 Oct 19:47 UTC.** Checked first: it was redundant, not referenced by any script, and every name in it is still set in Vercel Production. Then overwritten and removed. The authoritative configuration (Vercel, `wp-config.php`, the private credentials file) is untouched |

### Code readiness for a future rotation (done; harmless today)

Release 11 (`f855e33`, committed locally, not deployed) makes every server read prefer `SUPABASE_SECRET_KEY` and fall back to `SUPABASE_SERVICE_ROLE_KEY`. Production sets only the legacy variable, so behaviour is unchanged.

Deploying release 11 removes the one technical obstacle to rotation. Without it, `src/middleware.js` and the `/admin` notification routes would break if only the new key were configured. The test `tests/unit/supabase-key-rotation.test.js` guards this.

### Optional rotation plan (owner-controlled; NOT executed; only if the owner changes the decision above)

1. **C1, without downtime:**
   1. Deploy release 11.
   2. Supabase → Project Settings → API Keys: create a secret key (`sb_secret_…`) and check that a publishable key exists.
   3. Vercel Production: set `SUPABASE_SECRET_KEY` (Sensitive), then redeploy.
   4. Verify `/`, `/blog`, `/admin` sign-in, the WordPress "Test connection" and `tools/verify-content-api-live.mjs`.
   5. Disable the legacy JWT API keys in Supabase, then verify again.
2. **C2:** Supabase → Database → Reset database password. Vercel holds no database URL or password, so the websites do not depend on it.
3. **C3, C4:** change them in `www.acadvizen.com/admin`.
4. **C7:** Hostinger, WordPress administrators, FTP or SFTP, Vercel.
5. **History rewrite:** not proposed. It would force-push every branch, and copies already cloned cannot be recalled. Rotation is the effective fix.

## 2. Integration security (verified on PRODUCTION, 12 Oct 19:41–19:47 UTC)

| Area | Finding | Evidence |
|---|---|---|
| Signed content API | Unsigned → 401 `missing_timestamp`; wrong secret → 401 `invalid_signature`; stale → 401 `stale_timestamp`; wrong purpose → 400; unknown entity → 400; signed read-only list → 200. Replay → 409 (12 Oct run) | AT-11/12 |
| Slug check / Test connection | Signed free address → no conflict; `/blog` → conflict "reserved"; `/a/../b` → 400 `invalid_path`. WordPress **Test connection** → "Connected" (19:46) | AT-10, AT-13 |
| Preview framing | `frame-ancestors 'self' https://enroll.acadvizen.com` on `/preview/wordpress/…` only; `'none'` elsewhere | AT-14 |
| Public bundles | 30 JavaScript chunks (1.35 MB) from 6 pages, including `/admin` and `/admin-login`, checked against 8 private values and 5 secret patterns: **0 findings**, no non-anon JWT. Source maps: 404 | AT-15 |
| Main admin | `/admin` signed out: a noindex shell with no data. `/api/admin/notifications` GET and POST signed out → 401 | AT-17 |
| Plugin REST | Unsigned `/manifest` → 401; `/blogs` returns published, Main-visible posts only | AT-16 |
| Render Bridge | Off (`WORDPRESS_CONTENT_ENABLED` not set in Vercel); `/api/wordpress/bridge-manifest` → 404 | AT-06 |
| WordPress capabilities | Non-blog Main screens need `edit_pages`; blog ownership enforced for Authors; Settings, Main media upload and the plugin installer refused to Author/Contributor (LOCAL 9/9) | AT-33/34 |
| Plugin provenance | Installed 0.6.1; the 4 publicly served plugin files are byte-identical to the package `dd6fcf27…e32c`; plugin source unchanged since `2cc2148` | AT-42 |
| Repository guard | `tools/check-secrets.mjs` pre-commit hook (ran on both release-11 commits: clean), GitHub "Secret scan" workflow; `.env`, `.env.local`, `.env*.local` and `.vercel` ignored | AT-56 |

## 3. Local machine

| Item | Finding | Action |
|---|---|---|
| Private credentials file (user profile) | Readable only by SYSTEM, Administrators and the owner's account | None |
| Project `.env.local` | Also writable by a `CodexSandboxUsers` group and four sandbox SIDs (another coding tool). It holds **no production private value** (compared privately) | Low. Optional: remove those entries with `icacls`. Not changed here, because it could break that tool |
| VS Code extension storage | An AI extension (Blackbox) keeps a copy of `.env.local` | Optional: clear that extension's storage |

## 4. Dependencies

`npm audit --omit=dev`: 2 high, both pre-existing:
- `nodemailer`: the fix needs major version 10;
- `sharp`: the copy pinned inside Next.js.

WordPress core 7.0.7 → 7.1.3 and 12 plugin updates are pending; apply them on staging first (`FINAL-OPEN-ISSUES.md` O-6).

## 5. Residual risk (open by the owner's decision; not remediated)

Anyone who reads the public history has:
- full read/write access to the Main database through the API (C1), including leads;
- direct database access (C2);
- `/admin` access (C3).

This exposure has existed since those commits were pushed, and it ends only when the credentials are rotated.
